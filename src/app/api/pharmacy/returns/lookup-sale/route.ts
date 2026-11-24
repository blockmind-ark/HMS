import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/pharmacy/returns/lookup-sale?query=POS-2026-0001
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "PHARMACIST" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query")?.trim();

    if (!query) {
      return NextResponse.json({ error: "Sale or invoice number is required" }, { status: 400 });
    }

    // Lookup sale by saleNumber or patient UID/name
    const sale = await prisma.pharmacySale.findFirst({
      where: {
        OR: [
          { saleNumber: { equals: query, mode: "insensitive" } },
          { id: query },
          { patient: { patientUid: { equals: query, mode: "insensitive" } } },
        ],
      },
      include: {
        patient: true,
        user: { select: { id: true, name: true } },
        items: {
          include: {
            medicine: {
              include: {
                batches: {
                  where: { approvalStatus: "APPROVED" },
                  orderBy: { createdAt: "desc" },
                  take: 1,
                },
              },
            },
          },
        },
        returns: {
          include: {
            items: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!sale) {
      return NextResponse.json(
        { error: `No sale found matching "${query}". Please check the POS sale number.` },
        { status: 404 }
      );
    }

    // Compute remaining returnable quantity per item (counting all non-rejected returns)
    const itemsWithReturnStatus = sale.items.map((item) => {
      let totalReturnedSoFar = 0;
      for (const ret of sale.returns || []) {
        if (ret.status === "REJECTED") continue;
        for (const ri of ret.items || []) {
          if (ri.medicineId === item.medicineId) {
            totalReturnedSoFar += ri.quantityReturned;
          }
        }
      }

      const returnableQuantity = Math.max(0, item.quantity - totalReturnedSoFar);

      return {
        id: item.id,
        medicineId: item.medicineId,
        medicineName: item.medicine.name,
        genericName: item.medicine.genericName,
        category: item.medicine.category,
        itemType: item.itemType,
        batchId: item.medicine.batches[0]?.id || null,
        batchNumber: item.medicine.batches[0]?.batchNumber || "N/A",
        soldQuantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        alreadyReturned: totalReturnedSoFar,
        returnableQuantity,
      };
    });

    return NextResponse.json({
      sale: {
        id: sale.id,
        saleNumber: sale.saleNumber,
        totalAmount: sale.totalAmount,
        discount: sale.discount,
        createdAt: sale.createdAt,
        patient: sale.patient
          ? {
              id: sale.patient.id,
              name: sale.patient.name,
              patientUid: sale.patient.patientUid,
              phone: sale.patient.phone,
            }
          : null,
        cashier: sale.user?.name || "Pharmacist",
        items: itemsWithReturnStatus,
        previousReturns: (sale.returns || []).map((r) => ({
          id: r.id,
          returnNumber: r.returnNumber,
          totalRefundAmount: r.totalRefundAmount,
          reason: r.reason,
          createdAt: r.createdAt,
        })),
      },
    });
  } catch (error: any) {
    console.error("GET /api/pharmacy/returns/lookup-sale error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to lookup sale invoice" },
      { status: 500 }
    );
  }
}
