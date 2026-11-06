import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query")?.trim() || "";
  const category = searchParams.get("category")?.trim() || "";

  const andConditions: any[] = [];
  if (query) {
    andConditions.push({
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { genericName: { contains: query, mode: "insensitive" } },
        { category: { contains: query, mode: "insensitive" } },
      ],
    });
  }
  if (category && category !== "All") {
    andConditions.push({ category: { equals: category, mode: "insensitive" } });
  }

  const medicines = await prisma.medicine.findMany({
    where: andConditions.length > 0 ? { AND: andConditions } : {},
    include: {
      batches: {
        where: { approvalStatus: "APPROVED", quantity: { gt: 0 } },
        orderBy: { expiryDate: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  const formatted = medicines.map((med) => {
    const totalStock = med.batches.reduce((sum, b) => sum + b.quantity, 0);
    const activeBatch = med.batches[0] || null;
    const rawSellingPrice = activeBatch ? activeBatch.sellingPrice : 0;
    const perOff = activeBatch?.perOff ?? med.perOff ?? 0;
    const discountedPrice = perOff > 0 ? Number((rawSellingPrice * (1 - perOff / 100)).toFixed(2)) : rawSellingPrice;

    return {
      id: med.id,
      name: med.name,
      genericName: med.genericName,
      category: med.category,
      itemType: med.itemType || "MEDICINE",
      threshold: med.threshold,
      perOff,
      totalStock,
      isLowStock: totalStock <= med.threshold,
      sellingPrice: rawSellingPrice,
      discountedPrice,
      purchasePrice: activeBatch ? activeBatch.purchasePrice : 0,
      activeBatchNumber: activeBatch ? activeBatch.batchNumber : "N/A",
      batchCount: med.batches.length,
    };
  });

  return NextResponse.json({ medicines: formatted });
}

