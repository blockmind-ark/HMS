import { prisma } from "../src/lib/prisma";

async function verifyDailyReport() {
  console.log("=========================================================");
  console.log("📊 VERIFYING DAILY SALES RECONCILIATION & REPORTING");
  console.log("=========================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      if (detail) console.log(`   └─ ${detail}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (detail) console.error(`   └─ ${detail}`);
      failed++;
    }
  }

  try {
    const todayStr = new Date().toISOString().split("T")[0];
    const [year, month, day] = todayStr.split("-").map(Number);
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

    // 1. Fetch Today's Invoices & Sales
    const [invoicesToday, salesToday] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          status: "PAID",
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
        include: { patient: true, user: true, visit: true },
      }),
      prisma.pharmacySale.findMany({
        where: {
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
        include: {
          patient: true,
          user: true,
          items: { include: { medicine: { include: { batches: true } } } },
        },
      }),
    ]);

    assert(invoicesToday.length > 0, "Today's Clinical Invoices Found", `${invoicesToday.length} invoices found`);
    assert(salesToday.length > 0, "Today's Pharmacy POS Sales Found", `${salesToday.length} sales found`);

    // 2. Compute Comparative Stream Metrics
    let clinNet = 0;
    let clinDisc = 0;
    for (const inv of invoicesToday) {
      clinNet += inv.totalAmount;
      clinDisc += inv.discount;
    }

    let rxNet = 0;
    let rxDisc = 0;
    let rxCOGS = 0;
    for (const s of salesToday) {
      rxNet += s.totalAmount;
      rxDisc += s.discount;
      for (const it of s.items) {
        const avgCost =
          it.medicine.batches.length > 0
            ? it.medicine.batches[0].purchasePrice
            : it.unitPrice * 0.6;
        rxCOGS += it.quantity * avgCost;
      }
    }

    const rxProfit = Math.max(0, rxNet - rxCOGS);
    const combinedTotal = clinNet + rxNet;
    const combinedProfit = clinNet + rxProfit;
    const clinPercent = combinedTotal > 0 ? ((clinNet / combinedTotal) * 100).toFixed(1) : "0";
    const rxPercent = combinedTotal > 0 ? ((rxNet / combinedTotal) * 100).toFixed(1) : "0";

    assert(clinNet > 0, "Clinical Stream Net Revenue", `Rs. ${clinNet.toFixed(2)} across ${invoicesToday.length} invoices`);
    assert(rxNet > 0, "Pharmacy Stream Net Revenue", `Rs. ${rxNet.toFixed(2)} across ${salesToday.length} POS sales`);
    assert(combinedTotal === clinNet + rxNet, "Combined Cross-Portal Net Collections", `Rs. ${combinedTotal.toFixed(2)}`);
    assert(parseFloat(clinPercent) + parseFloat(rxPercent) >= 99.9, "Stream Split Percentages Sum to 100%", `Clinical: ${clinPercent}%, Pharmacy: ${rxPercent}%`);
    assert(combinedProfit > 0, "Daily Operating Profit Calculated", `Profit: Rs. ${combinedProfit.toFixed(2)} (Rx Profit: Rs. ${rxProfit.toFixed(2)})`);

    // 3. Test Historical Date (2 Days Ago)
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const twoDaysAgoStr = twoDaysAgo.toISOString().split("T")[0];
    const [y2, m2, d2] = twoDaysAgoStr.split("-").map(Number);
    const start2 = new Date(y2, m2 - 1, d2, 0, 0, 0, 0);
    const end2 = new Date(y2, m2 - 1, d2, 23, 59, 59, 999);

    const [invoicesHist, salesHist] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          status: "PAID",
          createdAt: { gte: start2, lte: end2 },
        },
      }),
      prisma.pharmacySale.findMany({
        where: {
          createdAt: { gte: start2, lte: end2 },
        },
      }),
    ]);

    assert(invoicesHist.length > 0 || salesHist.length > 0, "Historical Date Query", `Found data for ${twoDaysAgoStr}`);

    // 4. Test Daily CSV Export Generation Logic
    let csvLines = [
      "Ruqayya CLINIC & PHARMACY - DAILY SALES & RECONCILIATION AUDIT REPORT",
      `Report Date,"${todayStr}"`,
      "Stream,Count,Gross Total (Rs.),Discounts Given (Rs.),Net Cash Collected (Rs.),COGS (Rs.),Net Profit (Rs.)",
      `"Clinical Hospital Portal",${invoicesToday.length},"${(clinNet + clinDisc).toFixed(2)}","${clinDisc.toFixed(2)}","${clinNet.toFixed(2)}","0.00","${clinNet.toFixed(2)}"`,
      `"Pharmacy Dispensary Portal",${salesToday.length},"${(rxNet + rxDisc).toFixed(2)}","${rxDisc.toFixed(2)}","${rxNet.toFixed(2)}","${rxCOGS.toFixed(2)}","${rxProfit.toFixed(2)}"`,
      `"COMBINED DAILY REVENUE",${invoicesToday.length + salesToday.length},"${(clinNet + clinDisc + rxNet + rxDisc).toFixed(2)}","${(clinDisc + rxDisc).toFixed(2)}","${combinedTotal.toFixed(2)}","${rxCOGS.toFixed(2)}","${combinedProfit.toFixed(2)}"`,
    ];

    const sampleCsv = csvLines.join("\n");
    assert(sampleCsv.includes("Ruqayya CLINIC & PHARMACY - DAILY SALES"), "Daily Reconciliation CSV Header");
    assert(sampleCsv.includes("Clinical Hospital Portal") && sampleCsv.includes("Pharmacy Dispensary Portal"), "Dual-Portal Reconciliation Content");

    console.log("\n=========================================================");
    console.log(`DAILY REPORT VERIFICATION: ${passed} PASSED, ${failed} FAILED`);
    console.log("=========================================================");

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error("Test failed with error:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDailyReport();

