import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "RECEPTIONIST" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const targetDateStr = searchParams.get("date"); // YYYY-MM-DD

  let dayStart: Date;
  let dayEnd: Date;

  if (targetDateStr && /^\d{4}-\d{2}-\d{2}$/.test(targetDateStr)) {
    const [y, m, d] = targetDateStr.split("-").map(Number);
    dayStart = new Date(y, m - 1, d, 0, 0, 0, 0);
    dayEnd = new Date(y, m - 1, d, 23, 59, 59, 999);
  } else {
    dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    dayEnd = new Date();
    dayEnd.setHours(23, 59, 59, 999);
  }

  const [invoices, visits] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        createdAt: { gte: dayStart, lte: dayEnd },
        status: "PAID",
      },
      include: {
        items: true,
        patient: {
          select: { id: true, name: true, patientUid: true, phone: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.visit.findMany({
      where: {
        createdAt: { gte: dayStart, lte: dayEnd },
      },
      include: {
        patient: {
          select: { id: true, name: true, patientUid: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Aggregate itemized sales
  const itemMap = new Map<
    string,
    {
      description: string;
      category: string;
      quantity: number;
      unitPrice: number;
      totalRevenue: number;
    }
  >();

  let totalRevenue = 0;
  let totalDiscount = 0;
  let totalGrossBilled = 0;
  let totalItemsSold = 0;

  for (const inv of invoices) {
    totalRevenue += inv.totalAmount;
    totalDiscount += inv.discount || 0;

    for (const item of inv.items) {
      const desc = item.description.trim();
      totalItemsSold += item.quantity;
      const itemSubtotal = item.quantity * item.price;
      totalGrossBilled += itemSubtotal;

      let category = "Consultation";
      const lower = desc.toLowerCase();
      if (lower.includes("ultrasound") || lower.includes("usg") || lower.includes("scan")) {
        category = "Ultrasound Imaging";
      } else if (lower.includes("emergency") || lower.includes("triage")) {
        category = "Emergency & Triage";
      } else if (lower.includes("specialist") || lower.includes("cardiology")) {
        category = "Specialist OPD";
      } else if (lower.includes("procedure") || lower.includes("dressing") || lower.includes("injection")) {
        category = "Clinical Procedure";
      }

      if (itemMap.has(desc)) {
        const existing = itemMap.get(desc)!;
        existing.quantity += item.quantity;
        existing.totalRevenue += itemSubtotal;
      } else {
        itemMap.set(desc, {
          description: desc,
          category,
          quantity: item.quantity,
          unitPrice: item.price,
          totalRevenue: itemSubtotal,
        });
      }
    }
  }

  const itemizedSales = Array.from(itemMap.values()).sort(
    (a, b) => b.totalRevenue - a.totalRevenue
  );

  const transactions = invoices.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    time: inv.createdAt,
    patientName: inv.patient?.name || "Walk-in Patient",
    patientUid: inv.patient?.patientUid || "N/A",
    items: inv.items.map((it) => ({
      description: it.description,
      quantity: it.quantity,
      price: it.price,
    })),
    totalAmount: inv.totalAmount,
    discount: inv.discount || 0,
    cashierName: inv.user?.name || "Adnan Ahmed",
  }));

  // Opening float for register accountability
  const openingFloat = 5000.0;
  const expectedCashInDrawer = openingFloat + totalRevenue;

  return NextResponse.json({
    success: true,
    targetDate: dayStart.toISOString().split("T")[0],
    staffName: session.user.name || "Adnan Ahmed (Receptionist)",
    staffRole: "Reception & Billing Desk",
    summary: {
      totalRevenue,
      totalGrossBilled,
      totalDiscount,
      totalInvoicesCount: invoices.length,
      totalVisitsCount: visits.length,
      totalItemsSold,
      openingFloat,
      expectedCashInDrawer,
    },
    itemizedSales,
    transactions,
  });
}

