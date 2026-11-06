import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const visits = await prisma.visit.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      patient: true,
      invoice: {
        include: { items: true, user: true },
      },
    },
  });

  return NextResponse.json({ visits });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    (session.user.role !== "RECEPTIONIST" &&
      session.user.role !== "PHARMACIST" &&
      session.user.role !== "ADMIN")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { patientId, serviceType, fee, discount = 0, items, tokenId } = body;

    if (!patientId || !serviceType || fee === undefined) {
      return NextResponse.json(
        { error: "patientId, serviceType, and fee are required" },
        { status: 400 }
      );
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const numericFee = parseFloat(fee);
    const numericDiscount = parseFloat(discount) || 0;
    const finalAmount = Math.max(0, numericFee - numericDiscount);

    // Generate unique sequential Invoice Number: INV-YYYY-XXXX
    const currentYear = new Date().getFullYear();
    const totalInvoices = await prisma.invoice.count();
    let nextNum = totalInvoices + 1;
    let invoiceNumber = `INV-${currentYear}-${String(nextNum).padStart(4, "0")}`;

    let invExists = await prisma.invoice.findUnique({ where: { invoiceNumber } });
    while (invExists) {
      nextNum++;
      invoiceNumber = `INV-${currentYear}-${String(nextNum).padStart(4, "0")}`;
      invExists = await prisma.invoice.findUnique({ where: { invoiceNumber } });
    }

    // Prepare line items
    const lineItems = items && Array.isArray(items) && items.length > 0
      ? items.map((it: any) => ({
          description: it.description || serviceType,
          quantity: it.quantity || 1,
          price: parseFloat(it.price) || numericFee,
        }))
      : [
          {
            description: serviceType,
            quantity: 1,
            price: numericFee,
          },
        ];

    // Transaction to create visit and linked invoice
    const result = await prisma.$transaction(async (tx) => {
      const visit = await tx.visit.create({
        data: {
          patientId,
          tokenId: tokenId || null,
          serviceType,
          fee: numericFee,
        },
      });

      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          patientId,
          visitId: visit.id,
          tokenId: tokenId || null,
          userId: session.user.id,
          totalAmount: finalAmount,
          discount: numericDiscount,
          status: "PAID",
          items: {
            create: lineItems,
          },
        },
        include: {
          items: true,
          patient: true,
          user: true,
          visit: true,
          token: true,
        },
      });

      return { visit, invoice };
    });

    await recordAuditLog({
      userId: session.user.id,
      action: "INVOICE_ISSUED",
      details: `Generated invoice ${result.invoice.invoiceNumber} (Rs. ${result.invoice.totalAmount.toFixed(
        2
      )}) for patient ${patient.name} (${patient.patientUid}) for service ${serviceType}.`,
    });

    return NextResponse.json({
      success: true,
      visit: result.visit,
      invoice: result.invoice,
    });
  } catch (error: any) {
    console.error("Visit/Invoice creation failed:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to issue visit invoice" },
      { status: 500 }
    );
  }
}

