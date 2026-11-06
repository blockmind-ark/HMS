import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function escapeCSV(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "PHARMACIST")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const filterCredit = searchParams.get("filterCredit") || "ALL";

  const where: any = {};
  if (filterCredit === "CREDIT") where.isCredit = true;
  if (filterCredit === "CASH") where.isCredit = false;

  const purchases = await prisma.inventoryPurchase.findMany({
    where,
    orderBy: { itemName: "asc" },
  });

  const headers = [
    "S.No",
    "Item Name",
    "Size / Specification",
    "PKG Packs",
    "Nos Per Pack",
    "Total Cost (Rs.)",
    "Per Tab/Unit Cost (Rs.)",
    "Per Pack Cost (Rs.)",
    "T.Value (Rs.)",
    "Per Tab/Unit Selling (Rs.)",
    "Qty Pur",
    "Batch No",
    "Expiry Date",
    "Credit Status",
    "Recorded At",
  ];

  const rows = purchases.map((p, index) => {
    const formattedExpiry = new Date(p.expiryDate).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const formattedCreated = new Date(p.createdAt).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    return [
      escapeCSV(index + 1),
      escapeCSV(p.itemName),
      escapeCSV(p.specification),
      escapeCSV(p.pkgPacks),
      escapeCSV(p.nosPerPack),
      escapeCSV(p.totalCost.toFixed(2)),
      escapeCSV(p.perUnitCost.toFixed(2)),
      escapeCSV(p.perPackCost.toFixed(2)),
      escapeCSV(p.totalValue.toFixed(2)),
      escapeCSV(p.perUnitSellingPrice.toFixed(2)),
      escapeCSV(p.qtyPurchased),
      escapeCSV(p.batchNo),
      escapeCSV(formattedExpiry),
      escapeCSV(p.isCredit ? "Credit" : "Cash"),
      escapeCSV(formattedCreated),
    ].join(",");
  });

  const csvContent = [headers.map(escapeCSV).join(","), ...rows].join("\r\n");

  const todayStr = new Date().toISOString().split("T")[0];
  const filename = `medical-inventory-purchase-sheet-${todayStr}.csv`;

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

