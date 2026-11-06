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

  const { searchParams } = new URL(req.url);
  const vendorId = searchParams.get("vendorId");
  const paymentMethod = searchParams.get("paymentMethod");
  const query = searchParams.get("query")?.trim() || "";
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const whereClause: any = {};

  if (vendorId && vendorId !== "ALL") {
    whereClause.vendorId = vendorId;
  }

  if (paymentMethod && paymentMethod !== "ALL") {
    whereClause.paymentMethod = paymentMethod;
  }

  if (startDate || endDate) {
    whereClause.paymentDate = {};
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      whereClause.paymentDate.gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      whereClause.paymentDate.lte = end;
    }
  }

  if (query) {
    whereClause.OR = [
      { paymentNumber: { contains: query, mode: "insensitive" } },
      { referenceNumber: { contains: query, mode: "insensitive" } },
      { notes: { contains: query, mode: "insensitive" } },
      { vendor: { name: { contains: query, mode: "insensitive" } } },
      { purchaseOrder: { poNumber: { contains: query, mode: "insensitive" } } },
    ];
  }

  const payments = await prisma.vendorPayment.findMany({
    where: whereClause,
    include: {
      vendor: {
        select: { id: true, name: true, phone: true, balance: true },
      },
      purchaseOrder: {
        select: { id: true, poNumber: true, totalAmount: true, paidAmount: true, paymentStatus: true },
      },
      paidBy: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { paymentDate: "desc" },
    take: 100,
  });

  return NextResponse.json({ payments });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "PHARMACIST")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      vendorId,
      purchaseOrderId,
      amount,
      paymentMethod = "Cash",
      referenceNumber,
      paymentDate,
      notes,
    } = body;

    if (!vendorId) {
      return NextResponse.json({ error: "Vendor is required." }, { status: 400 });
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        { error: "Payment amount must be a positive number." },
        { status: 400 }
      );
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    });
    if (!vendor) {
      return NextResponse.json({ error: "Selected vendor not found." }, { status: 404 });
    }

    // Verify purchase order if specified
    let po = null;
    if (purchaseOrderId) {
      po = await prisma.purchaseOrder.findUnique({
        where: { id: purchaseOrderId },
      });
      if (!po || po.vendorId !== vendorId) {
        return NextResponse.json(
          { error: "Purchase order does not belong to the selected vendor." },
          { status: 400 }
        );
      }
    }

    // Generate unique sequential payment number: VP-YYYY-XXXX
    const currentYear = new Date().getFullYear();
    const count = await prisma.vendorPayment.count();
    let nextNum = count + 1;
    let paymentNumber = `VP-${currentYear}-${String(nextNum).padStart(4, "0")}`;

    let exists = await prisma.vendorPayment.findUnique({ where: { paymentNumber } });
    while (exists) {
      nextNum++;
      paymentNumber = `VP-${currentYear}-${String(nextNum).padStart(4, "0")}`;
      exists = await prisma.vendorPayment.findUnique({ where: { paymentNumber } });
    }

    const pDate = paymentDate ? new Date(paymentDate) : new Date();

    // Transaction: Decrement vendor balance, update PO if linked, and record payment
    const payment = await prisma.$transaction(async (tx) => {
      // 1. Decrement vendor outstanding balance
      await tx.vendor.update({
        where: { id: vendorId },
        data: {
          balance: { decrement: numericAmount },
        },
      });

      // 2. Update linked purchase order if provided
      if (po) {
        const updatedPaid = po.paidAmount + numericAmount;
        const newStatus = updatedPaid >= po.totalAmount ? "PAID" : "PARTIAL";

        await tx.purchaseOrder.update({
          where: { id: po.id },
          data: {
            paidAmount: updatedPaid,
            paymentStatus: newStatus,
          },
        });
      }

      // 3. Create VendorPayment record
      return await tx.vendorPayment.create({
        data: {
          paymentNumber,
          vendorId,
          purchaseOrderId: po ? po.id : null,
          amount: numericAmount,
          paymentMethod: String(paymentMethod).trim(),
          referenceNumber: referenceNumber ? String(referenceNumber).trim() : null,
          paymentDate: pDate,
          notes: notes ? String(notes).trim() : null,
          paidById: session.user.id,
        },
        include: {
          vendor: true,
          purchaseOrder: true,
          paidBy: { select: { id: true, name: true, email: true } },
        },
      });
    });

    // Record immutable audit log
    await recordAuditLog({
      userId: session.user.id,
      action: "VENDOR_PAYMENT_RECORDED",
      details: `Recorded payment ${payment.paymentNumber} of Rs. ${numericAmount.toLocaleString()} to vendor '${
        vendor.name
      }' via ${payment.paymentMethod}${
        po ? ` against Purchase Order ${po.poNumber}` : " on general account"
      }${payment.referenceNumber ? ` (Ref: ${payment.referenceNumber})` : ""}.`,
    });

    return NextResponse.json({
      success: true,
      payment,
    });
  } catch (error: any) {
    console.error("Failed to record vendor payment:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process vendor payment." },
      { status: 500 }
    );
  }
}

