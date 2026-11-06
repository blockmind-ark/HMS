import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const targetDateStr = searchParams.get("date") || new Date().toISOString().split("T")[0];

  // Parse start and end of selected day (00:00:00 to 23:59:59.999)
  const [year, month, day] = targetDateStr.split("-").map(Number);
  const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
  const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

  // 1. Fetch Clinical Hospital Invoices for target date
  const clinicalInvoices = await prisma.invoice.findMany({
    where: {
      status: "PAID",
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      patient: true,
      user: { select: { id: true, name: true, email: true } },
      visit: true,
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // 2. Fetch Pharmacy POS Sales for target date
  const pharmacySales = await prisma.pharmacySale.findMany({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      patient: true,
      user: { select: { id: true, name: true, email: true } },
      items: {
        include: {
          medicine: {
            include: { batches: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // 3. Fetch Expenditures and Shift Closings for target date
  const [expenditures, shiftClosings] = await Promise.all([
    prisma.expenditure.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
    }),

    prisma.shiftClosing.findMany({
      where: {
        shiftDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        user: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalExpenditures = expenditures.reduce((sum, e) => sum + e.amount, 0);

  // 3. Clinical Calculations
  let clinicalGross = 0;
  let clinicalDiscounts = 0;
  let clinicalNet = 0;
  const serviceBreakdown: Record<string, { count: number; revenue: number }> = {
    OPD: { count: 0, revenue: 0 },
    Ultrasound: { count: 0, revenue: 0 },
    Consultation: { count: 0, revenue: 0 },
    Other: { count: 0, revenue: 0 },
  };

  for (const inv of clinicalInvoices) {
    clinicalNet += inv.totalAmount;
    clinicalDiscounts += inv.discount;
    clinicalGross += inv.totalAmount + inv.discount;

    const svc = (inv.visit?.serviceType || "Other").toLowerCase();
    if (svc.includes("opd")) {
      serviceBreakdown.OPD.count++;
      serviceBreakdown.OPD.revenue += inv.totalAmount;
    } else if (svc.includes("ultrasound")) {
      serviceBreakdown.Ultrasound.count++;
      serviceBreakdown.Ultrasound.revenue += inv.totalAmount;
    } else if (svc.includes("consultation")) {
      serviceBreakdown.Consultation.count++;
      serviceBreakdown.Consultation.revenue += inv.totalAmount;
    } else {
      serviceBreakdown.Other.count++;
      serviceBreakdown.Other.revenue += inv.totalAmount;
    }
  }

  // 4. Pharmacy Calculations
  let pharmacyNet = 0;
  let pharmacyDiscounts = 0;
  let pharmacyGross = 0;
  let pharmacyCOGS = 0;

  const formattedPharmacySales = pharmacySales.map((sale) => {
    let saleCOGS = 0;
    const itemsSummary = sale.items.map((item) => {
      const avgPurchasePrice =
        item.medicine.batches.length > 0
          ? item.medicine.batches[0].purchasePrice
          : item.unitPrice * 0.6;
      saleCOGS += item.quantity * avgPurchasePrice;
      return `${item.medicine.name} (x${item.quantity})`;
    });

    pharmacyNet += sale.totalAmount;
    pharmacyDiscounts += sale.discount;
    pharmacyGross += sale.totalAmount + sale.discount;
    pharmacyCOGS += saleCOGS;

    const saleProfit = Math.max(0, sale.totalAmount - saleCOGS);

    return {
      id: sale.id,
      saleNumber: sale.saleNumber,
      createdAt: sale.createdAt,
      patientUid: sale.patient?.patientUid || "WALK-IN",
      customerName: sale.patient?.name || "Walk-in Customer",
      pharmacistName: sale.user.name,
      itemsSummary: itemsSummary.join(", "),
      itemCount: sale.items.length,
      subtotal: sale.totalAmount + sale.discount,
      discount: sale.discount,
      totalAmount: sale.totalAmount,
      cogs: saleCOGS,
      profit: saleProfit,
    };
  });

  const pharmacyNetProfit = Math.max(0, pharmacyNet - pharmacyCOGS);
  const pharmacyProfitMargin =
    pharmacyNet > 0 ? ((pharmacyNetProfit / pharmacyNet) * 100).toFixed(1) : "0";

  // 5. Combined Reconciliation
  const combinedNet = clinicalNet + pharmacyNet;
  const combinedGross = clinicalGross + pharmacyGross;
  const combinedDiscounts = clinicalDiscounts + pharmacyDiscounts;
  const combinedNetProfit = clinicalNet + pharmacyNetProfit;

  const clinicalPercentage =
    combinedNet > 0 ? ((clinicalNet / combinedNet) * 100).toFixed(1) : "0";
  const pharmacyPercentage =
    combinedNet > 0 ? ((pharmacyNet / combinedNet) * 100).toFixed(1) : "0";

  return NextResponse.json({
    date: targetDateStr,
    summary: {
      clinicalNet,
      clinicalGross,
      clinicalDiscounts,
      clinicalCount: clinicalInvoices.length,
      pharmacyNet,
      pharmacyGross,
      pharmacyDiscounts,
      pharmacyCount: pharmacySales.length,
      pharmacyCOGS,
      pharmacyNetProfit,
      pharmacyProfitMargin,
      combinedNet,
      combinedGross,
      combinedDiscounts,
      combinedNetProfit,
      totalExpenditures,
      netProfitAfterExpenditures: combinedNetProfit - totalExpenditures,
      clinicalPercentage,
      pharmacyPercentage,
    },
    serviceBreakdown,
    expenditures,
    shiftClosings,
    clinicalInvoices: clinicalInvoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      createdAt: inv.createdAt,
      patientUid: inv.patient.patientUid,
      patientName: inv.patient.name,
      serviceType: inv.visit?.serviceType || "Clinical Consultation",
      operatorName: inv.user.name,
      subtotal: inv.totalAmount + inv.discount,
      discount: inv.discount,
      totalAmount: inv.totalAmount,
      status: inv.status,
    })),
    pharmacySales: formattedPharmacySales,
  });
}

