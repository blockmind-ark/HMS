import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";
import { CreateMedicineReturnSchema } from "@/lib/validations/returns";

// GET /api/pharmacy/returns: Fetch returns history or look up a sale by query
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "PHARMACIST" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "30", 10));
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { returnNumber: { contains: search, mode: "insensitive" } },
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { patientName: { contains: search, mode: "insensitive" } },
        { reason: { contains: search, mode: "insensitive" } },
        {
          items: {
            some: {
              medicine: {
                name: { contains: search, mode: "insensitive" },
              },
            },
          },
        },
      ];
    }

    const [returns, total] = await Promise.all([
      prisma.medicineReturn.findMany({
        where: whereClause,
        include: {
          items: {
            include: {
              medicine: true,
            },
          },
          sale: {
            include: {
              patient: true,
            },
          },
          processedBy: {
            select: { id: true, name: true, role: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.medicineReturn.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      returns,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("GET /api/pharmacy/returns error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch medicine returns" },
      { status: 500 }
    );
  }
}

// POST /api/pharmacy/returns: Process atomic medicine return & inventory restock
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "PHARMACIST" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = CreateMedicineReturnSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { saleId, invoiceNumber, patientName, customerPhone, reason, items } = parsed.data;

    // Optional sale verification if returning against an existing sale
    let originalSale: any = null;
    if (saleId) {
      originalSale = await prisma.pharmacySale.findUnique({
        where: { id: saleId },
        include: {
          items: true,
          returns: {
            include: {
              items: true,
            },
          },
        },
      });

      if (!originalSale) {
        return NextResponse.json({ error: "Original sale invoice not found" }, { status: 404 });
      }

      // Check return quantities do not exceed original sold quantities minus already returned (pending or approved)
      for (const returnItem of items) {
        const soldItem = originalSale.items.find((si: any) => si.medicineId === returnItem.medicineId);
        if (!soldItem) {
          return NextResponse.json(
            { error: `Medicine was not part of the original sale ${originalSale.saleNumber}` },
            { status: 400 }
          );
        }

        // Sum previously returned quantity for this medicine from this sale across non-rejected returns
        let previouslyReturned = 0;
        for (const ret of originalSale.returns || []) {
          if (ret.status === "REJECTED") continue;
          for (const ri of ret.items || []) {
            if (ri.medicineId === returnItem.medicineId) {
              previouslyReturned += ri.quantityReturned;
            }
          }
        }

        const remainingReturnable = soldItem.quantity - previouslyReturned;
        if (returnItem.quantityReturned > remainingReturnable) {
          return NextResponse.json(
            {
              error: `Cannot return ${returnItem.quantityReturned} units. Only ${remainingReturnable} returnable units remain for this item from sale ${originalSale.saleNumber}.`,
            },
            { status: 400 }
          );
        }
      }
    }

    // Generate unique sequential return number: RET-YYYY-XXXX
    const currentYear = new Date().getFullYear();
    const totalReturns = await prisma.medicineReturn.count();
    let nextNum = totalReturns + 1;
    let returnNumber = `RET-${currentYear}-${String(nextNum).padStart(4, "0")}`;

    let exists = await prisma.medicineReturn.findUnique({ where: { returnNumber } });
    while (exists) {
      nextNum++;
      returnNumber = `RET-${currentYear}-${String(nextNum).padStart(4, "0")}`;
      exists = await prisma.medicineReturn.findUnique({ where: { returnNumber } });
    }

    // Calculate total refund
    let totalRefundAmount = 0;
    for (const it of items) {
      totalRefundAmount += it.quantityReturned * it.unitPrice;
    }

    // Step A — Pharmacist Creates Return Receipt:
    // Create MedicineReturn with status: "PENDING_CLOSING". Do NOT increment Medicine.quantity yet.
    // Inventory restock occurs atomically when Admin accepts & approves the Daily Closing Sheet.
    const createdReturn = await prisma.$transaction(async (tx) => {
      // 1. Resolve batchId for audit record
      for (const item of items) {
        if (!item.batchId) {
          const defaultBatch = await tx.stockBatch.findFirst({
            where: { medicineId: item.medicineId },
            orderBy: [{ createdAt: "desc" }],
          });
          if (defaultBatch) {
            item.batchId = defaultBatch.id;
          }
        }
      }

      // 2. Persist MedicineReturn and items with status PENDING_CLOSING
      const newReturn = await tx.medicineReturn.create({
        data: {
          returnNumber,
          saleId: originalSale ? originalSale.id : null,
          invoiceNumber: invoiceNumber || (originalSale ? originalSale.saleNumber : null),
          patientName: patientName || (originalSale?.patient?.name ?? null),
          customerPhone: customerPhone || (originalSale?.patient?.phone ?? null),
          reason,
          totalRefundAmount,
          status: "PENDING_CLOSING",
          closingDate: new Date(),
          processedById: session.user.id,
          items: {
            create: items.map((it) => ({
              medicineId: it.medicineId,
              batchId: it.batchId ?? null,
              quantityReturned: it.quantityReturned,
              unitPrice: it.unitPrice,
              refundSubtotal: it.quantityReturned * it.unitPrice,
            })),
          },
        },
        include: {
          items: {
            include: {
              medicine: true,
            },
          },
          sale: {
            include: {
              patient: true,
            },
          },
          processedBy: {
            select: { id: true, name: true, role: true },
          },
        },
      });

      return newReturn;
    });

    // Record Immutable Audit Log
    await recordAuditLog({
      userId: session.user.id,
      action: "MEDICINE_RETURN_CREATED",
      details: `Created medicine return voucher ${createdReturn.returnNumber} (Refund: Rs. ${createdReturn.totalRefundAmount.toFixed(
        2
      )}) for ${items.length} item(s). Status: PENDING_CLOSING (Restock pending Daily Closing Admin Approval). Reason: "${reason}".${
        originalSale ? ` Linked sale: ${originalSale.saleNumber}.` : ""
      }`,
    });

    return NextResponse.json({
      success: true,
      return: createdReturn,
    });
  } catch (error: any) {
    console.error("POST /api/pharmacy/returns error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process medicine return" },
      { status: 500 }
    );
  }
}
