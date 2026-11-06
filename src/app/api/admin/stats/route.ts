import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    totalPatients,
    totalVisits,
    invoices,
    sales,
    pendingStockCount,
    pendingAdjustmentsCount,
    pendingShiftsCount,
    batches,
  ] = await Promise.all([
    prisma.patient.count(),
    prisma.visit.count(),
    prisma.invoice.findMany({
      where: { status: "PAID" },
      include: { items: true },
    }),
    prisma.pharmacySale.findMany({
      include: {
        items: {
          include: { medicine: { include: { batches: true } } },
        },
      },
    }),
    prisma.approvalRequest.count({
      where: { status: "PENDING" },
    }),
    prisma.drawerAdjustment.count({
      where: { status: "PENDING" },
    }),
    prisma.shiftClosing.count({
      where: { status: "PENDING_APPROVAL" },
    }),
    prisma.stockBatch.findMany({
      include: { medicine: true },
    }),
  ]);

  const pendingApprovalsCount = pendingStockCount + pendingAdjustmentsCount + pendingShiftsCount;

  // Financial calculations
  const totalClinicalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPharmacyRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalCombinedRevenue = totalClinicalRevenue + totalPharmacyRevenue;

  // Calculate Pharmacy COGS (Cost of Goods Sold) and Profit
  let pharmacyCOGS = 0;
  const medicineSalesMap: Record<
    string,
    { name: string; quantity: number; revenue: number }
  > = {};

  for (const sale of sales) {
    for (const item of sale.items) {
      // Find average or active purchase price
      const avgPurchasePrice =
        item.medicine.batches.length > 0
          ? item.medicine.batches[0].purchasePrice
          : item.unitPrice * 0.6; // fallback 60% if no batch
      pharmacyCOGS += item.quantity * avgPurchasePrice;

      if (!medicineSalesMap[item.medicine.id]) {
        medicineSalesMap[item.medicine.id] = {
          name: item.medicine.name,
          quantity: 0,
          revenue: 0,
        };
      }
      medicineSalesMap[item.medicine.id].quantity += item.quantity;
      medicineSalesMap[item.medicine.id].revenue += item.totalPrice;
    }
  }

  const pharmacyNetProfit = Math.max(0, totalPharmacyRevenue - pharmacyCOGS);
  const profitMarginPercent =
    totalPharmacyRevenue > 0
      ? ((pharmacyNetProfit / totalPharmacyRevenue) * 100).toFixed(1)
      : "0";

  // Top selling medicines sorted by quantity
  const topSellingMedicines = Object.values(medicineSalesMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Total current inventory valuation
  const inventoryValuation = batches
    .filter((b) => b.approvalStatus === "APPROVED")
    .reduce((sum, b) => sum + b.quantity * b.purchasePrice, 0);

  // Low stock detection (approved batches remaining <= threshold)
  const allMedicines = await prisma.medicine.findMany({
    include: {
      batches: {
        where: {
          approvalStatus: "APPROVED",
          quantity: { gt: 0 },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const lowStockItems = allMedicines
    .map((med) => {
      const totalStock = med.batches.reduce((sum, b) => sum + b.quantity, 0);
      return {
        id: med.id,
        name: med.name,
        genericName: med.genericName,
        category: med.category,
        itemType: med.itemType || "MEDICINE",
        threshold: med.threshold,
        totalStock,
        isLowStock: totalStock <= med.threshold,
      };
    })
    .filter((med) => med.isLowStock)
    .sort((a, b) => a.totalStock - b.totalStock);

  return NextResponse.json({
    metrics: {
      totalPatients,
      totalVisits,
      totalClinicalRevenue,
      totalPharmacyRevenue,
      totalCombinedRevenue,
      pharmacyCOGS,
      pharmacyNetProfit,
      profitMarginPercent,
      pendingApprovalsCount,
      inventoryValuation,
      lowStockCount: lowStockItems.length,
    },
    topSellingMedicines,
    lowStockItems,
    lowStockCount: lowStockItems.length,
  });
}

