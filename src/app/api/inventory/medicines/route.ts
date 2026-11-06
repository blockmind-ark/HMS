import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "PHARMACIST")) {
    return NextResponse.json({ error: "Unauthorized access to medicine inventory" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() || "";
  const filterCredit = searchParams.get("filterCredit") || searchParams.get("isCredit") || "ALL";
  const sortBy = searchParams.get("sortBy") || "sNo";
  const sortOrder = searchParams.get("sortOrder") === "desc" ? "desc" : "asc";

  const where: any = {};

  if (search) {
    where.OR = [
      { itemName: { contains: search, mode: "insensitive" } },
      { formPotencySpec: { contains: search, mode: "insensitive" } },
      { batchNo: { contains: search, mode: "insensitive" } },
    ];
  }

  if (filterCredit === "CREDIT" || filterCredit === "true") {
    where.isCredit = true;
  } else if (filterCredit === "CASH" || filterCredit === "false") {
    where.isCredit = false;
  }

  const orderBy: any = {};
  const validSortCols = [
    "sNo",
    "itemName",
    "formPotencySpec",
    "pkgPacks",
    "nosPerPack",
    "totalCost",
    "perUnitCost",
    "perPackCost",
    "totalValue",
    "perUnitSelling",
    "qtyPurchased",
    "batchNo",
    "expiryDate",
  ];

  if (validSortCols.includes(sortBy)) {
    orderBy[sortBy] = sortOrder;
  } else {
    orderBy.sNo = "asc";
  }

  try {
    const [medicines, allItems] = await Promise.all([
      prisma.medicineInventory.findMany({
        where,
        orderBy,
      }),
      prisma.medicineInventory.findMany({
        select: {
          totalCost: true,
          totalValue: true,
          qtyPurchased: true,
          isCredit: true,
        },
      }),
    ]);

    const totalCost = allItems.reduce((sum, item) => sum + item.totalCost, 0);
    const totalValue = allItems.reduce((sum, item) => sum + item.totalValue, 0);
    const totalUnits = allItems.reduce((sum, item) => sum + item.qtyPurchased, 0);
    const creditCount = allItems.filter((i) => i.isCredit).length;
    const cashCount = allItems.filter((i) => !i.isCredit).length;
    const creditTotalCost = allItems
      .filter((i) => i.isCredit)
      .reduce((sum, i) => sum + i.totalCost, 0);
    const cashTotalCost = allItems
      .filter((i) => !i.isCredit)
      .reduce((sum, i) => sum + i.totalCost, 0);

    return NextResponse.json({
      success: true,
      medicines,
      summary: {
        totalCost,
        totalValue,
        totalUnits,
        totalItemsCount: allItems.length,
        creditCount,
        cashCount,
        creditTotalCost,
        cashTotalCost,
        potentialMargin: totalValue - totalCost,
      },
    });
  } catch (error: any) {
    console.error("Failed to fetch medicine inventory:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error fetching medicine inventory" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "PHARMACIST")) {
    return NextResponse.json({ error: "Unauthorized to add medicine inventory entries" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      sNo,
      itemName,
      formPotencySpec,
      pkgPacks,
      nosPerPack,
      perPackCost,
      perUnitSelling,
      batchNo,
      expiryDate,
      isCredit,
    } = body;

    if (!itemName?.trim()) {
      return NextResponse.json({ error: "Item / Product Name is required" }, { status: 400 });
    }
    if (!formPotencySpec?.trim()) {
      return NextResponse.json({ error: "Form / Potency / Specification is required" }, { status: 400 });
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
    const parsedPerUnitSelling = Math.max(0, parseFloat(perUnitSelling) || 0);

    // Derived auto-calculations matching purchase sheet
    const qtyPurchased = parsedPkg * parsedNos;
    const totalCost = Number((parsedPkg * parsedPerPackCost).toFixed(2));
    const perUnitCost = Number((parsedPerPackCost / parsedNos).toFixed(2));
    const totalValue = Number((qtyPurchased * parsedPerUnitSelling).toFixed(2));

    // Determine S.No if not provided
    let assignedSNo = parseInt(sNo);
    if (!assignedSNo || isNaN(assignedSNo)) {
      const maxItem = await prisma.medicineInventory.findFirst({
        orderBy: { sNo: "desc" },
        select: { sNo: true },
      });
      assignedSNo = (maxItem?.sNo || 0) + 1;
    }

    const medicine = await prisma.medicineInventory.create({
      data: {
        sNo: assignedSNo,
        itemName: itemName.trim(),
        formPotencySpec: formPotencySpec.trim(),
        pkgPacks: parsedPkg,
        nosPerPack: parsedNos,
        totalCost,
        perUnitCost,
        perPackCost: parsedPerPackCost,
        totalValue,
        perUnitSelling: parsedPerUnitSelling,
        qtyPurchased,
        batchNo: batchNo.trim().toUpperCase(),
        expiryDate: new Date(expiryDate),
        isCredit: Boolean(isCredit),
        threshold: body.threshold ? parseInt(body.threshold, 10) : 10,
      },
    });

    await recordAuditLog({
      userId: session.user.id,
      action: "MEDICINE_INVENTORY_ADDED",
      details: `${session.user.name} added medicine inventory entry: #${medicine.sNo} ${medicine.itemName} (${medicine.formPotencySpec}) - ${medicine.qtyPurchased} units (Batch: ${medicine.batchNo}) for Rs. ${medicine.totalCost.toLocaleString()} (${medicine.isCredit ? "Credit" : "Cash"}).`,
    });

    return NextResponse.json({
      success: true,
      medicine,
      message: "Medicine inventory entry created successfully.",
    });
  } catch (error: any) {
    console.error("Failed to add medicine inventory:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error adding medicine inventory entry" },
      { status: 500 }
    );
  }
}

