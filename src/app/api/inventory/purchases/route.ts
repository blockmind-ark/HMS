import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "PHARMACIST")) {
    return NextResponse.json({ error: "Unauthorized access to inventory records" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() || "";
  const filterCredit = searchParams.get("filterCredit") || "ALL"; // "ALL" | "CREDIT" | "CASH"
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

  const where: any = {};

  if (search) {
    where.OR = [
      { itemName: { contains: search, mode: "insensitive" } },
      { specification: { contains: search, mode: "insensitive" } },
      { batchNo: { contains: search, mode: "insensitive" } },
    ];
  }

  if (filterCredit === "CREDIT") {
    where.isCredit = true;
  } else if (filterCredit === "CASH") {
    where.isCredit = false;
  }

  const orderBy: any = {};
  if (["itemName", "createdAt", "expiryDate", "totalCost", "totalValue", "qtyPurchased"].includes(sortBy)) {
    orderBy[sortBy] = sortOrder;
  } else {
    orderBy.createdAt = "desc";
  }

  try {
    const [purchases, allPurchases] = await Promise.all([
      prisma.inventoryPurchase.findMany({
        where,
        orderBy,
      }),
      // Query for overall summary totals
      prisma.inventoryPurchase.findMany({
        select: {
          totalCost: true,
          totalValue: true,
          qtyPurchased: true,
          isCredit: true,
        },
      }),
    ]);

    const totalCost = allPurchases.reduce((sum, p) => sum + p.totalCost, 0);
    const totalValue = allPurchases.reduce((sum, p) => sum + p.totalValue, 0);
    const totalUnits = allPurchases.reduce((sum, p) => sum + p.qtyPurchased, 0);
    const creditCount = allPurchases.filter((p) => p.isCredit).length;
    const cashCount = allPurchases.filter((p) => !p.isCredit).length;
    const creditTotalCost = allPurchases
      .filter((p) => p.isCredit)
      .reduce((sum, p) => sum + p.totalCost, 0);
    const cashTotalCost = allPurchases
      .filter((p) => !p.isCredit)
      .reduce((sum, p) => sum + p.totalCost, 0);

    return NextResponse.json({
      success: true,
      purchases,
      summary: {
        totalCost,
        totalValue,
        totalUnits,
        totalItemsCount: allPurchases.length,
        creditCount,
        cashCount,
        creditTotalCost,
        cashTotalCost,
        potentialMargin: totalValue - totalCost,
      },
    });
  } catch (error: any) {
    console.error("Failed to fetch inventory purchases:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error fetching inventory purchases" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "PHARMACIST")) {
    return NextResponse.json({ error: "Unauthorized to record stock purchases" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      itemName,
      specification,
      pkgPacks,
      nosPerPack,
      perPackCost,
      perUnitSellingPrice,
      batchNo,
      expiryDate,
      isCredit,
    } = body;

    if (!itemName?.trim()) {
      return NextResponse.json({ error: "Product / Item name is required" }, { status: 400 });
    }
    if (!specification?.trim()) {
      return NextResponse.json({ error: "Specification / Size is required" }, { status: 400 });
    }
    if (!batchNo?.trim()) {
      return NextResponse.json({ error: "Batch number is required" }, { status: 400 });
    }
    if (!expiryDate) {
      return NextResponse.json({ error: "Valid expiry date is required" }, { status: 400 });
    }

    const parsedPkg = Math.max(1, parseInt(pkgPacks) || 1);
    const parsedNos = Math.max(1, parseInt(nosPerPack) || 1);
    const parsedPerPackCost = Math.max(0, parseFloat(perPackCost) || 0);
    const parsedPerUnitSellingPrice = Math.max(0, parseFloat(perUnitSellingPrice) || 0);

    // Derived auto-calculations
    const qtyPurchased = parsedPkg * parsedNos;
    const totalCost = Number((parsedPkg * parsedPerPackCost).toFixed(2));
    const perUnitCost = Number((parsedPerPackCost / parsedNos).toFixed(2));
    const totalValue = Number((qtyPurchased * parsedPerUnitSellingPrice).toFixed(2));

    const purchase = await prisma.inventoryPurchase.create({
      data: {
        itemName: itemName.trim(),
        specification: specification.trim(),
        pkgPacks: parsedPkg,
        nosPerPack: parsedNos,
        totalCost,
        perUnitCost,
        perPackCost: parsedPerPackCost,
        totalValue,
        perUnitSellingPrice: parsedPerUnitSellingPrice,
        qtyPurchased,
        batchNo: batchNo.trim().toUpperCase(),
        expiryDate: new Date(expiryDate),
        isCredit: Boolean(isCredit),
      },
    });

    await recordAuditLog({
      userId: session.user.id,
      action: "INVENTORY_PURCHASE_ADDED",
      details: `${session.user.name} added stock purchase entry: ${purchase.itemName} (${purchase.specification}) - ${purchase.qtyPurchased} units (Batch: ${purchase.batchNo}) for Rs. ${purchase.totalCost.toLocaleString()} (${purchase.isCredit ? "Credit" : "Cash"}).`,
    });

    return NextResponse.json({
      success: true,
      purchase,
      message: "Medical inventory purchase entry saved successfully.",
    });
  } catch (error: any) {
    console.error("Failed to add inventory purchase:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error adding stock purchase" },
      { status: 500 }
    );
  }
}

