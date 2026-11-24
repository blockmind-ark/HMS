import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  try {
    const medicine = await prisma.medicine.findUnique({
      where: { id },
      include: {
        batches: {
          where: { approvalStatus: "APPROVED" },
          orderBy: [{ quantity: "desc" }, { createdAt: "desc" }],
        },
      },
    });

    if (!medicine) {
      return NextResponse.json({ error: "Medicine not found" }, { status: 404 });
    }

    const body = await req.json();
    const { perOff, sellingPrice, purchasePrice, threshold, quantity } = body;

    // Validate Quantity if provided
    let parsedQuantity: number | undefined = undefined;
    if (quantity !== undefined && quantity !== null && quantity !== "") {
      const numQty = Number(quantity);
      if (isNaN(numQty) || !Number.isInteger(numQty) || numQty < 0) {
        return NextResponse.json(
          { error: "Quantity (QTY) must be a valid non-negative integer (0 or greater)." },
          { status: 400 }
        );
      }
      parsedQuantity = numQty;
    }

    const medUpdateData: any = {};

    if (perOff !== undefined && perOff !== null && perOff !== "") {
      const parsedPerOff = Math.min(100, Math.max(0, parseFloat(String(perOff))));
      if (!isNaN(parsedPerOff)) {
        medUpdateData.perOff = parsedPerOff;
      }
    }

    if (threshold !== undefined && threshold !== null && threshold !== "") {
      const parsedThreshold = parseInt(String(threshold), 10);
      if (!isNaN(parsedThreshold) && parsedThreshold >= 0) {
        medUpdateData.threshold = parsedThreshold;
      }
    }

    const updatedMedicine = await prisma.medicine.update({
      where: { id },
      data: medUpdateData,
    });

    // If sellingPrice or purchasePrice or perOff was specified, prepare batch updates
    const batchUpdates: any = {};
    if (sellingPrice !== undefined && sellingPrice !== null && sellingPrice !== "") {
      const sp = parseFloat(String(sellingPrice));
      if (!isNaN(sp) && sp >= 0) batchUpdates.sellingPrice = sp;
    }
    if (purchasePrice !== undefined && purchasePrice !== null && purchasePrice !== "") {
      const pp = parseFloat(String(purchasePrice));
      if (!isNaN(pp) && pp >= 0) batchUpdates.purchasePrice = pp;
    }
    if (medUpdateData.perOff !== undefined) {
      batchUpdates.perOff = medUpdateData.perOff;
    }

    // Apply batch updates
    if (medicine.batches.length > 0) {
      if (Object.keys(batchUpdates).length > 0) {
        await prisma.stockBatch.updateMany({
          where: {
            medicineId: id,
            approvalStatus: "APPROVED",
          },
          data: batchUpdates,
        });
      }

      // If quantity is explicitly modified, set primary batch to parsedQuantity
      // and reset any auxiliary batches to 0 so totalStock equals parsedQuantity
      if (parsedQuantity !== undefined) {
        const primaryBatch = medicine.batches[0];
        await prisma.stockBatch.update({
          where: { id: primaryBatch.id },
          data: { quantity: parsedQuantity },
        });

        if (medicine.batches.length > 1) {
          const otherBatchIds = medicine.batches.slice(1).map((b) => b.id);
          await prisma.stockBatch.updateMany({
            where: { id: { in: otherBatchIds } },
            data: { quantity: 0 },
          });
        }
      }
    } else if (parsedQuantity !== undefined || Object.keys(batchUpdates).length > 0) {
      // If medicine has no batches yet, create a default approved batch
      const effectiveSp = batchUpdates.sellingPrice ?? 0;
      const effectivePp = batchUpdates.purchasePrice ?? 0;
      const effectivePerOff = medUpdateData.perOff ?? medicine.perOff ?? 0;
      const effectiveQty = parsedQuantity ?? 0;

      await prisma.stockBatch.create({
        data: {
          medicineId: id,
          batchNumber: `BATCH-DIRECT-${Date.now().toString().slice(-4)}`,
          quantity: effectiveQty,
          purchasePrice: effectivePp,
          sellingPrice: effectiveSp,
          perOff: effectivePerOff,
          mfgDate: new Date(),
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          approvalStatus: "APPROVED",
        },
      });
    }

    // Synchronize matching MedicineInventory entry if present
    await prisma.medicineInventory.updateMany({
      where: { itemName: { equals: medicine.name, mode: "insensitive" } },
      data: {
        ...(parsedQuantity !== undefined ? { qtyPurchased: parsedQuantity } : {}),
        ...(medUpdateData.threshold !== undefined ? { threshold: medUpdateData.threshold } : {}),
        ...(batchUpdates.sellingPrice !== undefined ? { perUnitSelling: batchUpdates.sellingPrice } : {}),
        ...(batchUpdates.purchasePrice !== undefined ? { perUnitCost: batchUpdates.purchasePrice } : {}),
        ...(medUpdateData.perOff !== undefined ? { perOff: medUpdateData.perOff } : {}),
      },
    });

    await recordAuditLog({
      userId: session.user.id,
      action: "MEDICINE_UPDATED",
      details: `Admin ${session.user.name} updated medicine ${medicine.name}: quantity = ${
        parsedQuantity !== undefined ? parsedQuantity + " units" : "unchanged"
      }, perOff = ${
        medUpdateData.perOff !== undefined ? medUpdateData.perOff + "%" : "unchanged"
      }, threshold = ${medUpdateData.threshold ?? "unchanged"}, sellingPrice = ${
        batchUpdates.sellingPrice ?? "unchanged"
      }, purchasePrice = ${batchUpdates.purchasePrice ?? "unchanged"}.`,
    });

    return NextResponse.json({
      success: true,
      medicine: updatedMedicine,
      message: "Medicine pricing, per-off discount, and stock quantity updated successfully.",
    });
  } catch (error: any) {
    console.error("Dynamic per-off update error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update dynamic per-off" },
      { status: 500 }
    );
  }
}

