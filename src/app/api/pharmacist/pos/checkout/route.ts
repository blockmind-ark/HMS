import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "PHARMACIST" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { patientId, items, discount = 0 } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Verify patient if ID provided
    let patient = null;
    if (patientId) {
      patient = await prisma.patient.findUnique({ where: { id: patientId } });
      if (!patient) {
        return NextResponse.json({ error: "Linked patient not found" }, { status: 404 });
      }
    }

    // Generate unique sequential POS Sale Number: POS-YYYY-XXXX
    const currentYear = new Date().getFullYear();
    const totalSales = await prisma.pharmacySale.count();
    let nextNum = totalSales + 1;
    let saleNumber = `POS-${currentYear}-${String(nextNum).padStart(4, "0")}`;

    let saleExists = await prisma.pharmacySale.findUnique({ where: { saleNumber } });
    while (saleExists) {
      nextNum++;
      saleNumber = `POS-${currentYear}-${String(nextNum).padStart(4, "0")}`;
      saleExists = await prisma.pharmacySale.findUnique({ where: { saleNumber } });
    }

    // Calculate totals
    let rawSubtotal = 0;
    for (const item of items) {
      rawSubtotal += item.quantity * item.unitPrice;
    }
    const finalTotal = Math.max(0, rawSubtotal - parseFloat(discount));

    // Execute atomic transaction: deduct stock batches and record sale
    const saleResult = await prisma.$transaction(async (tx) => {
      // 1. Deduct stock from batches & inventory tables
      for (const item of items) {
        const batch = await tx.stockBatch.findUnique({
          where: { id: item.batchId },
        });

        if (!batch) {
          throw new Error(`Stock batch for ${item.medicineName} not found`);
        }

        if (batch.quantity < item.quantity) {
          throw new Error(
            `Insufficient stock for ${item.medicineName} (Available: ${batch.quantity}, Requested: ${item.quantity})`
          );
        }

        // Deduct from active batch
        await tx.stockBatch.update({
          where: { id: item.batchId },
          data: {
            quantity: { decrement: item.quantity },
          },
        });
      }

      // 2. Create PharmacySale
      const newSale = await tx.pharmacySale.create({
        data: {
          saleNumber,
          patientId: patient ? patient.id : null,
          userId: session.user.id,
          totalAmount: finalTotal,
          discount: parseFloat(discount),
          items: {
            create: items.map((it: any) => ({
              medicineId: it.medicineId,
              itemType: it.itemType || "MEDICINE",
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              totalPrice: it.quantity * it.unitPrice,
            })),
          },
        },
        include: {
          items: { include: { medicine: true } },
          patient: true,
          user: true,
        },
      });

      return newSale;
    });

    const surgicalItemsCount = items.filter((it: any) => it.itemType === "SURGICAL").length;
    const medicineItemsCount = items.filter((it: any) => it.itemType !== "SURGICAL").length;

    await recordAuditLog({
      userId: session.user.id,
      action: "PHARMACY_SALE",
      details: `Completed dispensary POS sale ${saleResult.saleNumber} (Rs. ${saleResult.totalAmount.toFixed(
        2
      )}) with ${items.length} items (${medicineItemsCount} Medicines, ${surgicalItemsCount} Surgical/Supplies) ${
        patient
          ? `linked to patient ${patient.name} (${patient.patientUid})`
          : "for walk-in customer"
      }. Discount: Rs. ${saleResult.discount.toFixed(2)}.`,
    });

    return NextResponse.json({
      success: true,
      sale: saleResult,
    });
  } catch (error: any) {
    console.error("POS Checkout failed:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process pharmacy checkout" },
      { status: 500 }
    );
  }
}
