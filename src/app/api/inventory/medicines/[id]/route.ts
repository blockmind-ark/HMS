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
    return NextResponse.json({ error: "Unauthorized to edit medicine inventory" }, { status: 401 });
  }

  const { id } = params;

  try {
    const existing = await prisma.medicineInventory.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Medicine inventory entry not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      sNo,
      itemName,
      formPotencySpec,
      pkgPacks,
      nosPerPack,
      perPackCost,
      perUnitSelling,
      batchNo,
      expiryDate,
      isCredit,
    } = body;

    const parsedPkg = pkgPacks !== undefined ? Math.max(1, parseInt(pkgPacks) || 1) : existing.pkgPacks;
    const parsedNos = nosPerPack !== undefined ? Math.max(1, parseInt(nosPerPack) || 1) : existing.nosPerPack;
    const parsedPerPackCost = perPackCost !== undefined ? Math.max(0, parseFloat(perPackCost) || 0) : existing.perPackCost;
    const parsedPerUnitSelling =
      perUnitSelling !== undefined ? Math.max(0, parseFloat(perUnitSelling) || 0) : existing.perUnitSelling;

    // Derived auto-calculations matching purchase sheet
    const qtyPurchased = parsedPkg * parsedNos;
    const totalCost = Number((parsedPkg * parsedPerPackCost).toFixed(2));
    const perUnitCost = Number((parsedPerPackCost / parsedNos).toFixed(2));
    const totalValue = Number((qtyPurchased * parsedPerUnitSelling).toFixed(2));

    const updated = await prisma.medicineInventory.update({
      where: { id },
      data: {
        sNo: sNo !== undefined ? parseInt(sNo) : existing.sNo,
        itemName: itemName?.trim() || existing.itemName,
        formPotencySpec: formPotencySpec?.trim() || existing.formPotencySpec,
        pkgPacks: parsedPkg,
        nosPerPack: parsedNos,
        totalCost,
        perUnitCost,
        perPackCost: parsedPerPackCost,
        totalValue,
        perUnitSelling: parsedPerUnitSelling,
        qtyPurchased,
        batchNo: batchNo?.trim().toUpperCase() || existing.batchNo,
        expiryDate: expiryDate ? new Date(expiryDate) : existing.expiryDate,
        isCredit: isCredit !== undefined ? Boolean(isCredit) : existing.isCredit,
        threshold: body.threshold !== undefined ? parseInt(body.threshold, 10) : existing.threshold,
      },
    });

    await recordAuditLog({
      userId: session.user.id,
      action: "MEDICINE_INVENTORY_UPDATED",
      details: `${session.user.name} updated medicine inventory entry: #${updated.sNo} ${updated.itemName} (${updated.formPotencySpec}) - Batch ${updated.batchNo}.`,
    });

    return NextResponse.json({
      success: true,
      medicine: updated,
      message: "Medicine inventory entry updated successfully.",
    });
  } catch (error: any) {
    console.error("Failed to update medicine inventory:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error updating medicine inventory" },
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
    return NextResponse.json({ error: "Unauthorized to delete medicine inventory" }, { status: 401 });
  }

  const { id } = params;

  try {
    const existing = await prisma.medicineInventory.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Medicine inventory entry not found" }, { status: 404 });
    }

    await prisma.medicineInventory.delete({
      where: { id },
    });

    await recordAuditLog({
      userId: session.user.id,
      action: "MEDICINE_INVENTORY_DELETED",
      details: `${session.user.name} deleted medicine inventory entry: #${existing.sNo} ${existing.itemName} (${existing.formPotencySpec}), Batch ${existing.batchNo}.`,
    });

    return NextResponse.json({
      success: true,
      message: "Medicine inventory entry deleted successfully.",
    });
  } catch (error: any) {
    console.error("Failed to delete medicine inventory:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error deleting medicine inventory" },
      { status: 500 }
    );
  }
}

