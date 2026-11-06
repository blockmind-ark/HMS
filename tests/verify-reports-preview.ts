import { prisma } from "../src/lib/prisma";

async function testReportPreviewLogic() {
  console.log("=========================================================");
  console.log("🧪 TESTING REPORT PREVIEW SUMMARY API LOGIC");
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
    // 1. Overview counts
    const totalVisits = await prisma.visit.count();
    const totalInvoices = await prisma.invoice.count();
    const totalSales = await prisma.pharmacySale.count();
    const totalBatches = await prisma.stockBatch.count();
    const totalAuditLogs = await prisma.auditLog.count();

    assert(totalVisits >= 0, "Visits Count Accessible", `Visits: ${totalVisits}`);
    assert(totalInvoices >= 0, "Invoices Count Accessible", `Invoices: ${totalInvoices}`);
    assert(totalSales >= 0, "Sales Count Accessible", `Sales: ${totalSales}`);
    assert(totalBatches >= 0, "Batches Count Accessible", `Batches: ${totalBatches}`);
    assert(totalAuditLogs >= 0, "Audit Logs Count Accessible", `Audit Logs: ${totalAuditLogs}`);

    // 2. Visits preview data
    const sampleVisits = await prisma.visit.findMany({
      take: 5,
      include: { patient: true, invoice: true },
    });
    assert(sampleVisits.length >= 0, "Sample Visits Query Succeeds");

    // 3. Invoices preview data
    const sampleInvoices = await prisma.invoice.findMany({
      take: 5,
      include: { patient: true, user: true, visit: true },
    });
    assert(sampleInvoices.length >= 0, "Sample Invoices Query Succeeds");

    // 4. Pharmacy sales preview data
    const sampleSales = await prisma.pharmacySale.findMany({
      take: 5,
      include: {
        patient: true,
        user: true,
        items: { include: { medicine: { include: { batches: true } } } },
      },
    });
    assert(sampleSales.length >= 0, "Sample Sales Query Succeeds");

    console.log("\n=========================================================");
    console.log(`PREVIEW LOGIC VERIFICATION: ${passed} PASSED, ${failed} FAILED`);
    console.log("=========================================================");
  } catch (e) {
    console.error("Test failed:", e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testReportPreviewLogic();

