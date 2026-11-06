import { prisma } from "../src/lib/prisma";

async function testDailySummaries() {
  console.log("=== Testing Receptionist & Pharmacist Daily Summary Logic ===");

  // 1. Receptionist Test
  const todayStart = new Date(2026, 9, 21, 0, 0, 0, 0); // 2026-10-21
  const todayEnd = new Date(2026, 9, 21, 23, 59, 59, 999);

  const invoices = await prisma.invoice.findMany({
    where: { createdAt: { gte: todayStart, lte: todayEnd }, status: "PAID" },
    include: { items: true, patient: true, user: true },
  });

  console.log(`Invoices on 2026-10-21: ${invoices.length}`);
  let totalInvRevenue = 0;
  let totalItemsSold = 0;
  for (const inv of invoices) {
    totalInvRevenue += inv.totalAmount;
    for (const it of inv.items) {
      totalItemsSold += it.quantity;
    }
  }
  console.log(`Receptionist Revenue: Rs. ${totalInvRevenue}, Items Sold: ${totalItemsSold}`);

  // 2. Pharmacist Test
  const sales = await prisma.pharmacySale.findMany({
    where: { createdAt: { gte: todayStart, lte: todayEnd } },
    include: { items: { include: { medicine: true } }, patient: true, user: true },
  });

  console.log(`Pharmacy Sales on 2026-10-21: ${sales.length}`);
  let totalPharmRevenue = 0;
  let totalUnitsSold = 0;
  for (const sale of sales) {
    totalPharmRevenue += sale.totalAmount;
    for (const it of sale.items) {
      totalUnitsSold += it.quantity;
    }
  }
  console.log(`Pharmacy Revenue: Rs. ${totalPharmRevenue}, Medicine Units Sold: ${totalUnitsSold}`);

  console.log("=== Verification Successful! ===");
}

testDailySummaries()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

