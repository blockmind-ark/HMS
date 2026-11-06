import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vendor = await prisma.vendor.findUnique({
    where: { id: params.id },
    include: {
      purchaseOrders: {
        include: { items: true },
        orderBy: { createdAt: "desc" },
      },
      payments: {
        include: {
          paidBy: { select: { id: true, name: true, email: true } },
          purchaseOrder: { select: { id: true, poNumber: true } },
        },
        orderBy: { paymentDate: "desc" },
      },
    },
  });

  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  return NextResponse.json({ vendor });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, contactPerson, phone, email, address } = body;

    const vendor = await prisma.vendor.update({
      where: { id: params.id },
      data: {
        name: name ? String(name).trim() : undefined,
        contactPerson: contactPerson !== undefined ? String(contactPerson).trim() : undefined,
        phone: phone !== undefined ? String(phone).trim() : undefined,
        email: email !== undefined ? String(email).trim() : undefined,
        address: address !== undefined ? String(address).trim() : undefined,
      },
    });

    await recordAuditLog({
      userId: session.user.id,
      action: "VENDOR_UPDATED",
      details: `Updated details for vendor '${vendor.name}'.`,
    });

    return NextResponse.json({ success: true, vendor });
  } catch (error: any) {
    console.error("Failed to update vendor:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update vendor record." },
      { status: 500 }
    );
  }
}

