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
  const query = searchParams.get("query")?.trim() || "";

  const vendors = await prisma.vendor.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { contactPerson: { contains: query, mode: "insensitive" } },
            { phone: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: {
      purchaseOrders: {
        select: {
          id: true,
          poNumber: true,
          totalAmount: true,
          paidAmount: true,
          paymentStatus: true,
          status: true,
          createdAt: true,
        },
      },
      payments: {
        select: {
          id: true,
          amount: true,
          paymentDate: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const formatted = vendors.map((v) => {
    const totalPurchased = v.purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0);
    const totalPaid = v.payments.reduce((sum, p) => sum + p.amount, 0);
    const pendingPoCount = v.purchaseOrders.filter((po) => po.paymentStatus !== "PAID").length;

    return {
      id: v.id,
      name: v.name,
      contactPerson: v.contactPerson || "—",
      phone: v.phone || "—",
      email: v.email || "—",
      address: v.address || "—",
      balance: v.balance,
      totalPurchased,
      totalPaid,
      purchaseOrdersCount: v.purchaseOrders.length,
      pendingPoCount,
      purchaseOrders: v.purchaseOrders,
      createdAt: v.createdAt,
    };
  });

  return NextResponse.json({ vendors: formatted });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "PHARMACIST")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, contactPerson, phone, email, address, openingBalance = 0 } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Vendor / Supplier name is required." }, { status: 400 });
    }

    const trimmedName = name.trim();

    // Check unique name
    const exists = await prisma.vendor.findUnique({
      where: { name: trimmedName },
    });
    if (exists) {
      return NextResponse.json(
        { error: `Vendor with name '${trimmedName}' already exists.` },
        { status: 400 }
      );
    }

    const balanceNum = parseFloat(openingBalance) || 0;

    const vendor = await prisma.vendor.create({
      data: {
        name: trimmedName,
        contactPerson: contactPerson?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        address: address?.trim() || null,
        balance: balanceNum,
      },
    });

    await recordAuditLog({
      userId: session.user.id,
      action: "VENDOR_CREATED",
      details: `Created new supplier profile for '${vendor.name}' with initial balance Rs. ${vendor.balance.toLocaleString()}.`,
    });

    return NextResponse.json({ success: true, vendor });
  } catch (error: any) {
    console.error("Failed to create vendor:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create vendor record." },
      { status: 500 }
    );
  }
}

