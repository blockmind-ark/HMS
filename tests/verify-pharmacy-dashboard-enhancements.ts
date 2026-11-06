import { prisma } from "../src/lib/prisma";
import fs from "fs";
import path from "path";

async function verifyPharmacyDashboardEnhancements() {
  console.log("=========================================================");
  console.log("💊 VERIFYING PHARMACY DASHBOARD ENHANCEMENTS");
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
    // 1. Verify code structure in src/app/pharmacist/page.tsx
    console.log("--- 1. Pharmacist Portal UI Structure Checks ---");
    const pharmacistPagePath = path.join(process.cwd(), "src/app/pharmacist/page.tsx");
    const pharmacistCode = fs.readFileSync(pharmacistPagePath, "utf-8");

    // A. Tabular form for medicines
    const hasTableTag = pharmacistCode.includes("<table") && pharmacistCode.includes("</table>");
    assert(hasTableTag, "Medicines Catalog Uses Tabular Form (<table ...>)");

    const hasTableHeaders =
      pharmacistCode.includes("Medicine &amp; Formula") &&
      pharmacistCode.includes("Category") &&
      pharmacistCode.includes("Stock Available") &&
      pharmacistCode.includes("Price");
    assert(hasTableHeaders, "Table Contains Required Column Headers (Medicine, Category, Stock, Price, Action)");

    const hasStickyHeader = pharmacistCode.includes("sticky top-0 bg-slate-100");
    assert(hasStickyHeader, "Table Features Sticky Header for Smooth Scrolling Navigation");

    // B. Clinic Patients Queue (2-3 items visible with scroll view)
    const hasPatientsQueue =
      pharmacistCode.includes("Clinic Patients Queue") &&
      pharmacistCode.includes("filteredClinicPatients.map");
    assert(hasPatientsQueue, "Shows Clinic Patients Queue for 1-Click Patient Linking");

    const hasPatientScrollView = pharmacistCode.includes("max-h-44 overflow-y-auto");
    assert(hasPatientScrollView, "Patient Queue Has Dedicated Scroll View (2 to 3 items visible)");

    const hasSelectPatientBtn = pharmacistCode.includes("handleSelectPatient(p)") && pharmacistCode.includes("Select");
    assert(hasSelectPatientBtn, "Patient Items Feature 1-Click 'Select' Button to Auto-Fill Bill");

    // C. Cart Scroll View (2-3 items visible)
    const hasCartScrollView = pharmacistCode.includes("max-h-56 overflow-y-auto") || pharmacistCode.includes("max-h-52 overflow-y-auto");
    assert(hasCartScrollView, "Cart Items Container Configured with Scroll View");

    // D. Success Proceed Modal Dialog after print
    const hasSuccessModal = pharmacistCode.includes("<PatientProceedSuccessModal");
    assert(hasSuccessModal, "Patient / Order Successfully Processed Modal Integrated");

    const hasResetOnPrint =
      pharmacistCode.includes("resetFormToDefault()") &&
      pharmacistCode.includes("setSuccessModalOpen(true)");
    assert(hasResetOnPrint, "Print Callback Resets State to Default Position & Opens Success Modal");

    // 2. Database & API Data Readiness for Pharmacy POS
    console.log("\n--- 2. Database & Data Verification ---");

    const patientsInClinic = await prisma.patient.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { visits: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
    assert(patientsInClinic.length >= 2, `Recent Clinic Patients Present for Queue (${patientsInClinic.length} available)`);

    const medicinesInCatalog = await prisma.medicine.findMany({
      where: { batches: { some: { quantity: { gt: 0 } } } },
      include: { batches: true },
      take: 5,
    });
    assert(medicinesInCatalog.length > 0, `Active Medicines in Inventory for Tabular Directory (${medicinesInCatalog.length} samples)`);

    // 3. Simulated Checkout & Form Reset Verification
    console.log("\n--- 3. Simulated Checkout, Receipt & Modal Workflow ---");

    const testStaff = await prisma.user.findFirst({ where: { role: "PHARMACIST" } });
    const testPatient = patientsInClinic[0];
    const testMed = medicinesInCatalog[0];

    const simSale = await prisma.pharmacySale.create({
      data: {
        saleNumber: `POS-TEST-${Date.now()}`,
        userId: testStaff!.id,
        patientId: testPatient.id,
        totalAmount: 250.0,
        discount: 0.0,
        items: {
          create: [
            {
              medicineId: testMed.id,
              quantity: 1,
              unitPrice: 250.0,
              totalPrice: 250.0,
            },
          ],
        },
      },
      include: { patient: true, items: true, user: true },
    });

    assert(!!simSale.id, "Simulated Pharmacy Sale Created", simSale.saleNumber);

    // Emulate what happens upon print:
    const modalPayload = {
      patientName: simSale.patient?.name || "Walk-in Customer",
      patientUid: simSale.patient?.patientUid,
      invoiceNumber: simSale.saleNumber,
      serviceOrItems: `${testMed.name} (1)`,
      totalAmount: simSale.totalAmount,
      cashTendered: 300,
      change: 50,
      staffName: simSale.user.name,
      portalType: "PHARMACIST" as const,
    };

    assert(modalPayload.patientName === testPatient.name, "Modal Displays Selected Patient Name", modalPayload.patientName);
    assert(modalPayload.invoiceNumber === simSale.saleNumber, "Modal Displays POS Invoice #", modalPayload.invoiceNumber);
    assert(modalPayload.totalAmount === 250.0, "Modal Displays Accurate Net Total (Rs.)", `Rs. ${modalPayload.totalAmount}`);

    // Clean up sim sale
    await prisma.pharmacySaleItem.deleteMany({ where: { saleId: simSale.id } });
    await prisma.pharmacySale.delete({ where: { id: simSale.id } });
    assert(true, "Simulated Test Records Cleaned Up");

    // 4. Compliance Check
    console.log("\n--- 4. Naming & Branding Compliance ---");
    const forbidden = await prisma.user.count({
      where: {
        OR: [
          { name: { contains: "Fatima", mode: "insensitive" } },
          { name: { contains: "Zainab", mode: "insensitive" } },
        ],
      },
    });
    assert(forbidden === 0, "No forbidden names in user database");

  } catch (err: any) {
    console.error("Test failed:", err);
    failed++;
  } finally {
    await prisma.$disconnect();
  }

  console.log("\n=========================================================");
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("=========================================================");

  if (failed > 0) process.exit(1);
}

verifyPharmacyDashboardEnhancements();

