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
  const paymentStatus = searchParams.get("paymentStatus");

  const whereClause: any = {};
  if (vendorId && vendorId !== "ALL") whereClause.vendorId = vendorId;
  if (paymentStatus && paymentStatus !== "ALL") whereClause.paymentStatus = paymentStatus;

  const purchaseOrders = await prisma.purchaseOrder.findMany({
    where: whereClause,
    include: {
      vendor: { select: { id: true, name: true, phone: true } },
      items: true,
      payments: {
        select: { id: true, paymentNumber: true, amount: true, paymentDate: true, paymentMethod: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ purchaseOrders });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "PHARMACIST")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { vendorId, items, notes } = body;

    if (!vendorId) {
      return NextResponse.json({ error: "Vendor is required." }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "At least one purchase item is required." }, { status: 400 });
    }

    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found." }, { status: 404 });
    }

    // Calculate line items total
    let totalAmount = 0;
    const validatedItems = items.map((it: any) => {
      const qty = parseInt(it.quantity, 10) || 1;
      const unitPrice = parseFloat(it.unitPrice) || 0;
      const totalPrice = qty * unitPrice;
      totalAmount += totalPrice;

      return {
        medicineName: String(it.medicineName || "Pharmaceutical Product").trim(),
        genericName: it.genericName ? String(it.genericName).trim() : null,
        quantity: qty,
        unitPrice,
        totalPrice,
      };
    });

    if (totalAmount <= 0) {
      return NextResponse.json(
        { error: "Total purchase order amount must be greater than zero." },
        { status: 400 }
      );
    }

    // Generate unique PO Number: PO-YYYY-XXXX
    const currentYear = new Date().getFullYear();
    const count = await prisma.purchaseOrder.count();
    let nextNum = count + 1;
    let poNumber = `PO-${currentYear}-${String(nextNum).padStart(4, "0")}`;

    let exists = await prisma.purchaseOrder.findUnique({ where: { poNumber } });
    while (exists) {
      nextNum++;
      poNumber = `PO-${currentYear}-${String(nextNum).padStart(4, "0")}`;
      exists = await prisma.purchaseOrder.findUnique({ where: { poNumber } });
    }

    // Transaction: Create PO and increase vendor balance (what we owe them)
    const po = await prisma.$transaction(async (tx) => {
      await tx.vendor.update({
        where: { id: vendorId },
        data: {
          balance: { increment: totalAmount },
        },
      });

      return await tx.purchaseOrder.create({
        data: {
          poNumber,
          vendorId,
          totalAmount,
          paidAmount: 0,
          paymentStatus: "UNPAID",
          status: "APPROVED",
          notes: notes ? String(notes).trim() : null,
          items: {
            create: validatedItems,
          },
        },
        include: {
          vendor: true,
          items: true,
        },
      });
    });

    await recordAuditLog({
      userId: session.user.id,
      action: "PURCHASE_ORDER_CREATED",
      details: `Created Purchase Order ${po.poNumber} for vendor '${vendor.name}' totaling Rs. ${totalAmount.toLocaleString()} (${validatedItems.length} items).`,
    });

    return NextResponse.json({ success: true, purchaseOrder: po });
  } catch (error: any) {
    console.error("Failed to create purchase order:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create purchase order." },
      { status: 500 }
    );
  }
}

