import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";
import { ApprovalStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const batches = await prisma.stockBatch.findMany({
    include: {
      medicine: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ batches });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "PHARMACIST" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      medicineId,
      newMedicineName,
      newGenericName,
      newCategory,
      threshold,
      newThreshold,
      perOff,
      batchNumber,
      quantity,
      purchasePrice,
      sellingPrice,
      mfgDate,
      expiryDate,
      reason,
    } = body;

    let targetMedicineId = medicineId;

    const parsedPerOff = Math.min(100, Math.max(0, parseFloat(perOff) || 0));

    // If new medicine is being added along with batch
    if (!targetMedicineId && newMedicineName) {
      const initThreshold = parseInt(threshold || newThreshold, 10) || 10;
      const createdMed = await prisma.medicine.create({
        data: {
          name: newMedicineName.trim(),
          genericName: newGenericName?.trim() || newMedicineName.trim(),
          category: newCategory || "General",
          threshold: initThreshold,
          perOff: parsedPerOff,
        },
      });
      targetMedicineId = createdMed.id;
    }

    if (!targetMedicineId || !batchNumber || !quantity || !purchasePrice || !sellingPrice) {
      return NextResponse.json(
        { error: "Medicine, batch number, quantity, and pricing are required" },
        { status: 400 }
      );
    }

    const medicine = await prisma.medicine.findUnique({
      where: { id: targetMedicineId },
    });

    if (!medicine) {
      return NextResponse.json({ error: "Medicine not found" }, { status: 404 });
    }

    const parsedThreshold =
      threshold !== undefined && threshold !== null && threshold !== ""
        ? parseInt(threshold, 10)
        : (newThreshold !== undefined && newThreshold !== null && newThreshold !== ""
            ? parseInt(newThreshold, 10)
            : medicine.threshold || 10);

    const finalThreshold = isNaN(parsedThreshold) || parsedThreshold < 0 ? 10 : parsedThreshold;

    // Create the batch in PENDING state awaiting Admin approval
    const newBatch = await prisma.stockBatch.create({
      data: {
        medicineId: targetMedicineId,
        batchNumber: batchNumber.trim().toUpperCase(),
        quantity: parseInt(quantity, 10),
        purchasePrice: parseFloat(purchasePrice),
        sellingPrice: parseFloat(sellingPrice),
        perOff: parsedPerOff,
        mfgDate: mfgDate ? new Date(mfgDate) : new Date(),
        expiryDate: expiryDate ? new Date(expiryDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 2),
        approvalStatus: ApprovalStatus.PENDING,
      },
    });

    // Create matching ApprovalRequest with threshold & perOff settings
    const approvalReq = await prisma.approvalRequest.create({
      data: {
        type: "INVENTORY_ADD",
        details: JSON.stringify({
          medicineId: medicine.id,
          medicineName: medicine.name,
          genericName: medicine.genericName,
          batchNumber: newBatch.batchNumber,
          quantity: newBatch.quantity,
          purchasePrice: newBatch.purchasePrice,
          sellingPrice: newBatch.sellingPrice,
          perOff: parsedPerOff,
          mfgDate: newBatch.mfgDate,
          expiryDate: newBatch.expiryDate,
          threshold: finalThreshold,
          reason: reason || "Pharmacist stock batch intake request.",
          batchId: newBatch.id,
        }),
        requestedById: session.user.id,
        status: ApprovalStatus.PENDING,
      },
    });

    await recordAuditLog({
      userId: session.user.id,
      action: "STOCK_REQUEST_SUBMITTED",
      details: `Submitted restock request for ${newBatch.quantity} units of ${medicine.name} (Batch: ${newBatch.batchNumber}). Awaiting Admin approval.`,
    });

    return NextResponse.json({
      success: true,
      batch: newBatch,
      approvalRequest: approvalReq,
    });
  } catch (error: any) {
    console.error("Batch request creation error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to submit batch request" },
      { status: 500 }
    );
  }
}

