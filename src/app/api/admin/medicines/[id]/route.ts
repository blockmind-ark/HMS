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
          where: { approvalStatus: "APPROVED", quantity: { gt: 0 } },
        },
      },
    });

    if (!medicine) {
      return NextResponse.json({ error: "Medicine not found" }, { status: 404 });
    }

    const body = await req.json();
    const { perOff, sellingPrice, purchasePrice, threshold } = body;

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

    // If sellingPrice or purchasePrice or perOff was specified, update active batches as well
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

    if (Object.keys(batchUpdates).length > 0 && medicine.batches.length > 0) {
      await prisma.stockBatch.updateMany({
        where: {
          medicineId: id,
          approvalStatus: "APPROVED",
        },
        data: batchUpdates,
      });
    }

    await recordAuditLog({
      userId: session.user.id,
      action: "MEDICINE_PRICING_UPDATED",
      details: `Admin ${session.user.name} dynamically updated ${medicine.name}: perOff = ${
        medUpdateData.perOff !== undefined ? medUpdateData.perOff + "%" : "unchanged"
      }, threshold = ${medUpdateData.threshold ?? "unchanged"}, sellingPrice = ${
        batchUpdates.sellingPrice ?? "unchanged"
      }, purchasePrice = ${batchUpdates.purchasePrice ?? "unchanged"}.`,
    });

    return NextResponse.json({
      success: true,
      medicine: updatedMedicine,
      message: "Medicine pricing & per-off discount updated dynamically.",
    });
  } catch (error: any) {
    console.error("Dynamic per-off update error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update dynamic per-off" },
      { status: 500 }
    );
  }
}

