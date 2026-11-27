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
  // Optional pagination: legacy callers still receive the complete result.
  const pageParam = searchParams.get("page");
  const sizeParam = searchParams.get("pageSize");
  const paginated = pageParam !== null || sizeParam !== null;
  const page = Number(pageParam ?? 1);
  const pageSize = Number(sizeParam ?? 50);
  if (paginated && (!Number.isSafeInteger(page) || page < 1 ||
      !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100 ||
      !Number.isSafeInteger((page - 1) * pageSize))) {
    return NextResponse.json({ error: "Invalid pagination" }, { status: 400 });
  }


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

  // All catalogue reads share a snapshot, including totals and page details.
  return prisma.$transaction(async (tx) => {
  // Keep global low-stock counts accurate while fetching full batch details only for the page.
  const stockWhere = { approvalStatus: "APPROVED" as const, quantity: { gt: 0 } };
  const orderBy = [{ itemType: "asc" as const }, { name: "asc" as const }, { id: "asc" as const }];
  const stockRows = paginated ? await tx.medicine.findMany({
    where: whereClause,
    select: { id: true, threshold: true, batches: { where: stockWhere, select: { quantity: true } } },
    orderBy,
  }) : null;
  const lowRows = stockRows?.filter(m => m.batches.reduce((sum, b) => sum + b.quantity, 0) <= m.threshold);
  const matchingRows = lowStockOnly ? lowRows : stockRows;
  const pageIds = matchingRows?.slice((page - 1) * pageSize, page * pageSize).map(m => m.id);

  // Fetch medicines with active approved batches
  const medicines = await tx.medicine.findMany({
    where: pageIds ? { AND: [whereClause, { id: { in: pageIds } }] } : whereClause,
    include: {
      batches: {
        where: {
          approvalStatus: "APPROVED",
          quantity: { gt: 0 },
        },
        orderBy: { expiryDate: "asc" }, // FEFO: First Expired, First Out
      },
    },
    orderBy: paginated ? orderBy : [{ itemType: "asc" }, { name: "asc" }],
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
    tx.medicine.count({ where: { itemType: "MEDICINE" } }),
    tx.medicine.count({ where: { itemType: "SURGICAL" } }),
  ]);

  // Distinct categories matching current itemType selection
  const categoryWhere = itemType !== "ALL" ? { itemType } : {};
  const allCategories = await tx.medicine.findMany({
    where: categoryWhere,
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });

  const lowStockCount = lowRows?.length ?? results.filter((m) => m.isLowStock).length;
  const filteredResults = lowStockOnly ? results.filter((m) => m.isLowStock) : results;

  const totalFound = matchingRows?.length ?? filteredResults.length;
  return NextResponse.json({
    medicines: filteredResults,
    ...(paginated ? { pagination: {
      page, pageSize, total: totalFound,
      totalPages: Math.ceil(totalFound / pageSize),
      hasNext: page * pageSize < totalFound,
    } } : {}),
    summary: {
      totalFound,
      totalMedicines,
      totalSurgical,
      totalCombined: totalMedicines + totalSurgical,
      categories: ["All", ...allCategories.map((c) => c.category)],
      lowStockCount,
    },
  }, { headers: { "Cache-Control": "private, no-store" } });
  }, { isolationLevel: "RepeatableRead" });
}
