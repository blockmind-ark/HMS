import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "PHARMACIST")) {
    return NextResponse.json({ error: "Unauthorized to edit stock purchase records" }, { status: 401 });
  }

  const { id } = params;

  try {
    const existing = await prisma.inventoryPurchase.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Inventory purchase entry not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      itemName,
      specification,
      pkgPacks,
      nosPerPack,
      perPackCost,
      perUnitSellingPrice,
      batchNo,
      expiryDate,
      isCredit,
    } = body;

    const parsedPkg = pkgPacks !== undefined ? Math.max(1, parseInt(pkgPacks) || 1) : existing.pkgPacks;
    const parsedNos = nosPerPack !== undefined ? Math.max(1, parseInt(nosPerPack) || 1) : existing.nosPerPack;
    const parsedPerPackCost = perPackCost !== undefined ? Math.max(0, parseFloat(perPackCost) || 0) : existing.perPackCost;
    const parsedPerUnitSellingPrice =
      perUnitSellingPrice !== undefined ? Math.max(0, parseFloat(perUnitSellingPrice) || 0) : existing.perUnitSellingPrice;

    // Derived auto-calculations
    const qtyPurchased = parsedPkg * parsedNos;
    const totalCost = Number((parsedPkg * parsedPerPackCost).toFixed(2));
    const perUnitCost = Number((parsedPerPackCost / parsedNos).toFixed(2));
    const totalValue = Number((qtyPurchased * parsedPerUnitSellingPrice).toFixed(2));

    const updated = await prisma.inventoryPurchase.update({
      where: { id },
      data: {
        itemName: itemName?.trim() || existing.itemName,
        specification: specification?.trim() || existing.specification,
        pkgPacks: parsedPkg,
        nosPerPack: parsedNos,
        totalCost,
        perUnitCost,
        perPackCost: parsedPerPackCost,
        totalValue,
        perUnitSellingPrice: parsedPerUnitSellingPrice,
        qtyPurchased,
        batchNo: batchNo?.trim().toUpperCase() || existing.batchNo,
        expiryDate: expiryDate ? new Date(expiryDate) : existing.expiryDate,
        isCredit: isCredit !== undefined ? Boolean(isCredit) : existing.isCredit,
      },
    });

    await recordAuditLog({
      userId: session.user.id,
      action: "INVENTORY_PURCHASE_UPDATED",
      details: `${session.user.name} updated stock purchase record: ${updated.itemName} (${updated.specification}) - Batch ${updated.batchNo}.`,
    });

    return NextResponse.json({
      success: true,
      purchase: updated,
      message: "Purchase record updated successfully.",
    });
  } catch (error: any) {
    console.error("Failed to update inventory purchase:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error updating stock purchase" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "PHARMACIST")) {
    return NextResponse.json({ error: "Unauthorized to delete stock purchase records" }, { status: 401 });
  }

  const { id } = params;

  try {
    const existing = await prisma.inventoryPurchase.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Inventory purchase record not found" }, { status: 404 });
    }

    await prisma.inventoryPurchase.delete({
      where: { id },
    });

    await recordAuditLog({
      userId: session.user.id,
      action: "INVENTORY_PURCHASE_DELETED",
      details: `${session.user.name} deleted stock purchase record: ${existing.itemName} (${existing.specification}), Batch ${existing.batchNo}.`,
    });

    return NextResponse.json({
      success: true,
      message: "Inventory purchase record deleted successfully.",
    });
  } catch (error: any) {
    console.error("Failed to delete inventory purchase:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error deleting stock purchase" },
      { status: 500 }
    );
  }
}

