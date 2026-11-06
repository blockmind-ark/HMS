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

  const medicines = await prisma.medicineInventory.findMany({
    where,
    orderBy: { sNo: "asc" },
  });

  const headers = [
    "S.No",
    "Item / Product Name",
    "Form / Potency / Specification",
    "PKGPacks",
    "Nos Per pack",
    "Total cost",
    "Per Tab / Unit Cost",
    "Per pack Cost",
    "T.Value",
    "Per Tab / Unit Selling Price",
    "Qty Pur",
    "Batch no",
    "Expiry date",
    "Credit status",
  ];

  const rows = medicines.map((m) => {
    const formattedExpiry = new Date(m.expiryDate).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    return [
      escapeCSV(m.sNo),
      escapeCSV(m.itemName),
      escapeCSV(m.formPotencySpec),
      escapeCSV(m.pkgPacks),
      escapeCSV(m.nosPerPack),
      escapeCSV(m.totalCost.toFixed(2)),
      escapeCSV(m.perUnitCost.toFixed(2)),
      escapeCSV(m.perPackCost.toFixed(2)),
      escapeCSV(m.totalValue.toFixed(2)),
      escapeCSV(m.perUnitSelling.toFixed(2)),
      escapeCSV(m.qtyPurchased),
      escapeCSV(m.batchNo),
      escapeCSV(formattedExpiry),
      escapeCSV(m.isCredit ? "Credit" : "Cash"),
    ].join(",");
  });

  const csvContent = [headers.map(escapeCSV).join(","), ...rows].join("\r\n");

  const todayStr = new Date().toISOString().split("T")[0];
  const filename = `hospital-medicine-purchase-sheet-289-${todayStr}.csv`;

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

