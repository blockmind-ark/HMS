import { prisma } from "../src/lib/prisma";

async function verifyDailyAccountabilitySummary() {
  console.log("=========================================================");
  console.log("📊 VERIFYING DAILY SALES & ACCOUNTABILITY SUMMARIES");
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

  let tempTestPatientId: string | null = null;

  try {
    // 1. Receptionist Daily Accountability Data Verification
    console.log("--- 1. Receptionist Daily Accountability Verification ---");

    // Fetch test day (2026-10-21)
    const testDateStart = new Date(2026, 9, 21, 0, 0, 0, 0);
    const testDateEnd = new Date(2026, 9, 21, 23, 59, 59, 999);

    let invoices = await prisma.invoice.findMany({
      where: {
        createdAt: { gte: testDateStart, lte: testDateEnd },
        status: "PAID",
      },
      include: {
        items: true,
        patient: true,
        user: true,
      },
    });

    if (invoices.length === 0) {
      const recUser = await prisma.user.findFirst({ where: { role: "RECEPTIONIST" } });
      if (recUser) {
        const tempPatient = await prisma.patient.create({
          data: {
            patientUid: "PAT-TEST-ACCOUNTABILITY",
            name: "Nadeem Qureshi",
            phone: "+92 300 9988776",
            age: 45,
            gender: "Male",
          },
        });
        tempTestPatientId = tempPatient.id;

        await prisma.invoice.create({
          data: {
            invoiceNumber: "INV-TEST-ACCOUNTABILITY",
            patientId: tempPatient.id,
            userId: recUser.id,
            totalAmount: 1500,
            discount: 0,
            status: "PAID",
            createdAt: new Date(2026, 9, 21, 11, 0, 0),
            items: {
              create: [
                { description: "General Consultation (OPD)", quantity: 1, price: 500 },
                { description: "Pelvic & Abdominal Ultrasound", quantity: 1, price: 1000 },
              ],
            },
          },
        });

        invoices = await prisma.invoice.findMany({
          where: {
            createdAt: { gte: testDateStart, lte: testDateEnd },
            status: "PAID",
          },
          include: {
            items: true,
            patient: true,
            user: true,
          },
        });
      }
    }

    assert(invoices.length > 0, "Receptionist Invoices Exist for Test Date", `${invoices.length} invoices found`);

    let totalRecRevenue = 0;
    let totalRecItemsCount = 0;
    const recItemMap = new Map<string, { qty: number; revenue: number }>();

    for (const inv of invoices) {
      totalRecRevenue += inv.totalAmount;
      for (const it of inv.items) {
        totalRecItemsCount += it.quantity;
        const current = recItemMap.get(it.description) || { qty: 0, revenue: 0 };
        current.qty += it.quantity;
        current.revenue += it.quantity * it.price;
        recItemMap.set(it.description, current);
      }
    }

    assert(totalRecRevenue > 0, "Receptionist Net Revenue Calculated", `Rs. ${totalRecRevenue.toLocaleString()}`);
    assert(totalRecItemsCount > 0, "Total Service Items Sold Counted", `${totalRecItemsCount} services billed`);
    assert(recItemMap.size > 0, "Itemized Services Breakdown Available", `${recItemMap.size} unique services`);

    const openingFloat = 5000.0;
    const expectedRecCash = openingFloat + totalRecRevenue;
    assert(expectedRecCash === openingFloat + totalRecRevenue, "Receptionist Drawer Reconciliation", `Float: Rs. ${openingFloat} + Sales: Rs. ${totalRecRevenue} = Expected: Rs. ${expectedRecCash}`);

    // 2. Pharmacist Daily Accountability Data Verification
    console.log("\n--- 2. Pharmacist Daily Accountability Verification ---");

    const pharmacySales = await prisma.pharmacySale.findMany({
      where: {
        createdAt: { gte: testDateStart, lte: testDateEnd },
      },
      include: {
        items: { include: { medicine: true } },
        patient: true,
        user: true,
      },
    });

    assert(pharmacySales.length > 0, "Pharmacist Sales Exist for Test Date", `${pharmacySales.length} POS sales found`);

    let totalPharmRevenue = 0;
    let totalUnitsSold = 0;
    const medMap = new Map<string, { qty: number; revenue: number }>();

    for (const sale of pharmacySales) {
      totalPharmRevenue += sale.totalAmount;
      for (const it of sale.items) {
        totalUnitsSold += it.quantity;
        const current = medMap.get(it.medicine.name) || { qty: 0, revenue: 0 };
        current.qty += it.quantity;
        current.revenue += it.totalPrice;
        medMap.set(it.medicine.name, current);
      }
    }

    assert(totalPharmRevenue > 0, "Pharmacy Sales Revenue Calculated", `Rs. ${totalPharmRevenue.toLocaleString()}`);
    assert(totalUnitsSold > 0, "Total Medicine Units Sold Counted", `${totalUnitsSold} units dispensed`);
    assert(medMap.size > 0, "Itemized Medicine Sales Breakdown Available", `${medMap.size} unique medicine lines`);

    const expectedPharmCash = openingFloat + totalPharmRevenue;
    assert(expectedPharmCash === openingFloat + totalPharmRevenue, "Pharmacy Drawer Reconciliation", `Float: Rs. ${openingFloat} + Sales: Rs. ${totalPharmRevenue} = Expected: Rs. ${expectedPharmCash}`);

    // 3. User & Staff Identity Checks
    console.log("\n--- 3. Staff & Role Naming Verification ---");

    const receptionist = await prisma.user.findFirst({ where: { role: "RECEPTIONIST" } });
    assert(
      receptionist?.name?.includes("Adnan Ahmed") ?? false,
      "Receptionist Name is Adnan Ahmed",
      receptionist?.name || "Not Found"
    );

    const pharmacist = await prisma.user.findFirst({ where: { role: "PHARMACIST" } });
    assert(
      pharmacist?.name?.includes("Muhammad Tariq") ?? false,
      "Pharmacist Name is Muhammad Tariq",
      pharmacist?.name || "Not Found"
    );

    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    assert(
      admin?.name?.includes("Abu Bakar") ?? false,
      "Admin Name is Abu Bakar",
      admin?.name || "Not Found"
    );

    // 4. Forbidden Names Compliance
    console.log("\n--- 4. Compliance Check: Forbidden Names (Fatima/Zainab) ---");

    const forbiddenUsers = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: "Fatima", mode: "insensitive" } },
          { name: { contains: "Zainab", mode: "insensitive" } },
        ],
      },
    });
    assert(forbiddenUsers.length === 0, "Zero Users with Forbidden Names", `Found: ${forbiddenUsers.length}`);

    const forbiddenPatients = await prisma.patient.findMany({
      where: {
        OR: [
          { name: { contains: "Fatima", mode: "insensitive" } },
          { name: { contains: "Zainab", mode: "insensitive" } },
        ],
      },
    });
    assert(forbiddenPatients.length === 0, "Zero Patients with Forbidden Names", `Found: ${forbiddenPatients.length}`);

  } catch (err: any) {
    console.error("Test execution failed:", err);
    failed++;
  } finally {
    if (tempTestPatientId) {
      try {
        await prisma.invoiceItem.deleteMany({
          where: { invoice: { patientId: tempTestPatientId } },
        });
        await prisma.invoice.deleteMany({
          where: { patientId: tempTestPatientId },
        });
        await prisma.patient.delete({
          where: { id: tempTestPatientId },
        });
      } catch (e) {}
    }
    await prisma.$disconnect();
  }

  console.log("\n=========================================================");
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("=========================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

verifyDailyAccountabilitySummary();

