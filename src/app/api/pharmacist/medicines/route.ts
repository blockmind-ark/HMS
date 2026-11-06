import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query")?.trim() || "";
  const category = searchParams.get("category")?.trim() || "";
  const itemType = (searchParams.get("itemType")?.trim() || "ALL").toUpperCase(); // "ALL" | "MEDICINE" | "SURGICAL"
  const lowStockOnly = searchParams.get("lowStockOnly") === "true";

  const andConditions: any[] = [];

  if (query) {
    andConditions.push({
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { genericName: { contains: query, mode: "insensitive" } },
        { category: { contains: query, mode: "insensitive" } },
        {
          batches: {
            some: {
              batchNumber: { contains: query, mode: "insensitive" },
            },
          },
        },
      ],
    });
  }

  if (itemType && itemType !== "ALL") {
    andConditions.push({ itemType: { equals: itemType } });
  }

  if (category && category !== "All" && category !== "All Types") {
    andConditions.push({ category: { equals: category, mode: "insensitive" } });
  }

  const whereClause = andConditions.length > 0 ? { AND: andConditions } : {};

  // Fetch medicines with active approved batches
  const medicines = await prisma.medicine.findMany({
    where: whereClause,
    include: {
      batches: {
        where: {
          approvalStatus: "APPROVED",
          quantity: { gt: 0 },
        },
        orderBy: { expiryDate: "asc" }, // FEFO: First Expired, First Out
      },
    },
    orderBy: [{ itemType: "asc" }, { name: "asc" }],
  });

  // Calculate available stock and check generic discount eligibility
  const results = medicines.map((med) => {
    const totalStock = med.batches.reduce((sum, b) => sum + b.quantity, 0);
    const activeBatch = med.batches[0] || null;
    const isLowStock = totalStock <= med.threshold;

    // Generic medicine identification (only for medicines, not surgical supplies):
    const isGeneric =
      med.itemType === "MEDICINE" &&
      (med.name.toLowerCase().includes(med.genericName.toLowerCase()) ||
        med.genericName.toLowerCase().includes(med.name.toLowerCase()) ||
        med.name.toLowerCase().split(" ")[0] === med.genericName.toLowerCase().split(" ")[0]);

    const rawSellingPrice = activeBatch ? activeBatch.sellingPrice : 0;
    const perOff = activeBatch?.perOff ?? med.perOff ?? 0;
    const effectiveSellingPrice = perOff > 0 ? Number((rawSellingPrice * (1 - perOff / 100)).toFixed(2)) : rawSellingPrice;

    return {
      id: med.id,
      name: med.name,
      genericName: med.genericName,
      category: med.category,
      itemType: med.itemType || "MEDICINE",
      threshold: med.threshold,
      perOff,
      originalPrice: rawSellingPrice,
      createdAt: med.createdAt,
      totalStock,
      isLowStock,
      activeBatch,
      isGeneric,
      sellingPrice: effectiveSellingPrice,
      purchasePrice: activeBatch ? activeBatch.purchasePrice : 0,
      batchNumber: activeBatch ? activeBatch.batchNumber : "N/A",
      expiryDate: activeBatch ? activeBatch.expiryDate : null,
    };
  });

  // Fetch overall catalog stats for tabs & category switcher
  const [totalMedicines, totalSurgical] = await Promise.all([
    prisma.medicine.count({ where: { itemType: "MEDICINE" } }),
    prisma.medicine.count({ where: { itemType: "SURGICAL" } }),
  ]);

  // Distinct categories matching current itemType selection
  const categoryWhere = itemType !== "ALL" ? { itemType } : {};
  const allCategories = await prisma.medicine.findMany({
    where: categoryWhere,
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });

  const lowStockCount = results.filter((m) => m.isLowStock).length;
  const filteredResults = lowStockOnly ? results.filter((m) => m.isLowStock) : results;

  return NextResponse.json({
    medicines: filteredResults,
    summary: {
      totalFound: filteredResults.length,
      totalMedicines,
      totalSurgical,
      totalCombined: totalMedicines + totalSurgical,
      categories: ["All", ...allCategories.map((c) => c.category)],
      lowStockCount,
    },
  });
}
