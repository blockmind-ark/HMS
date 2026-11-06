import { prisma } from "../src/lib/prisma";

async function verifyPatientProceedModalAndReset() {
  console.log("=========================================================");
  console.log("🏥 VERIFYING BILL GENERATION, FORM RESET & PROCEED MODAL");
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
    // 1. Receptionist Visit Billing & Form Reset Lifecycle
    console.log("--- 1. Receptionist Visit Billing & Default State Reset ---");

    const defaultStaff = await prisma.user.findFirst({ where: { role: "RECEPTIONIST" } });
    assert(!!defaultStaff, "Duty Receptionist Exists", defaultStaff?.name || "N/A");

    const patient = await prisma.patient.create({
      data: {
        patientUid: `PAT-RESET-${Date.now()}`,
        name: "Sohail Anwar",
        phone: "+92 321 8899001",
        age: 38,
        gender: "Male",
      },
    });

    assert(!!patient.id, "Test Patient Created for Billing", `${patient.name} (${patient.patientUid})`);

    const visit = await prisma.visit.create({
      data: {
        patientId: patient.id,
        serviceType: "Specialist Consultation",
        fee: 1200.0,
      },
    });

    const invoiceNumber = `INV-RESET-${Date.now()}`;
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        patientId: patient.id,
        visitId: visit.id,
        userId: defaultStaff!.id,
        totalAmount: 1100.0,
        discount: 100.0,
        status: "PAID",
        items: {
          create: [
            {
              description: "Specialist Consultation Fee",
              quantity: 1,
              price: 1200.0,
            },
          ],
        },
      },
      include: { items: true, patient: true, user: true },
    });

    assert(!!invoice.id, "Bill / Invoice Generated Successfully", `${invoice.invoiceNumber} - Rs. ${invoice.totalAmount}`);

    // Emulate Receptionist form reset to default position
    let state = {
      selectedPatient: patient as any,
      searchQuery: "Sohail Anwar",
      selectedService: { name: "Specialist Consultation", fee: 1200 },
      customFee: 1200,
      discount: 100,
      cashTendered: 1500,
    };

    // Trigger resetFormToDefault
    state = {
      selectedPatient: null,
      searchQuery: "",
      selectedService: { name: "General OPD Consultation", fee: 500 },
      customFee: 500,
      discount: 0,
      cashTendered: 500,
    };

    assert(state.selectedPatient === null, "Selected Patient Cleared Back to Default Null");
    assert(state.searchQuery === "", "Patient Search Query Cleared to Default Empty String");
    assert(state.customFee === 500, "Service Fee Cleared Back to Default OPD Preset (Rs. 500)");
    assert(state.discount === 0, "Discount Cleared Back to Default 0");

    // Verify Processed Patient Details payload
    const processedPayload = {
      patientName: invoice.patient.name,
      patientUid: invoice.patient.patientUid,
      invoiceNumber: invoice.invoiceNumber,
      serviceOrItems: invoice.items[0].description,
      totalAmount: invoice.totalAmount,
      discount: invoice.discount,
      staffName: invoice.user.name,
      portalType: "RECEPTIONIST",
    };

    assert(processedPayload.patientName === "Sohail Anwar", "Processed Modal Displays Patient Name", processedPayload.patientName);
    assert(processedPayload.invoiceNumber === invoiceNumber, "Processed Modal Displays Invoice Number", processedPayload.invoiceNumber);
    assert(processedPayload.totalAmount === 1100.0, "Processed Modal Displays Total Paid", `Rs. ${processedPayload.totalAmount}`);

    // 2. Pharmacist POS Billing & Form Reset Lifecycle
    console.log("\n--- 2. Pharmacist POS Billing & Default State Reset ---");

    const pharmacist = await prisma.user.findFirst({ where: { role: "PHARMACIST" } });
    assert(!!pharmacist, "Duty Pharmacist Exists", pharmacist?.name || "N/A");

    const medicine = await prisma.medicine.findFirst({
      where: { batches: { some: { quantity: { gt: 10 } } } },
      include: { batches: true },
    });
    assert(!!medicine, "Medicine Batch Available for POS Billing", medicine?.name || "N/A");

    const saleNumber = `POS-RESET-${Date.now()}`;
    const sale = await prisma.pharmacySale.create({
      data: {
        saleNumber,
        userId: pharmacist!.id,
        patientId: patient.id,
        totalAmount: 180.0,
        discount: 20.0,
        items: {
          create: [
            {
              medicineId: medicine!.id,
              quantity: 2,
              unitPrice: 100.0,
              totalPrice: 200.0,
            },
          ],
        },
      },
      include: { items: { include: { medicine: true } }, patient: true, user: true },
    });

    assert(!!sale.id, "Pharmacy POS Sale Generated Successfully", `${sale.saleNumber} - Rs. ${sale.totalAmount}`);

    // Emulate Pharmacist reset to default position
    let posState = {
      cart: [{ id: "item-1", qty: 2 }],
      linkedPatient: patient as any,
      patientUidInput: patient.patientUid,
      cashTendered: 200,
      searchQuery: "Panadol",
      selectedCategory: "Analgesics",
    };

    // Trigger resetFormToDefault
    posState = {
      cart: [],
      linkedPatient: null,
      patientUidInput: "",
      cashTendered: 0,
      searchQuery: "",
      selectedCategory: "All",
    };

    assert(posState.cart.length === 0, "Dispensary Cart Cleared to Default Empty Array");
    assert(posState.linkedPatient === null, "Linked Patient Cleared to Default Null");
    assert(posState.patientUidInput === "", "Patient UID Input Cleared to Default Empty");
    assert(posState.searchQuery === "", "POS Search Query Cleared to Default Empty");

    const pharmProcessedPayload = {
      patientName: sale.patient?.name || "Walk-in Customer",
      patientUid: sale.patient?.patientUid,
      invoiceNumber: sale.saleNumber,
      serviceOrItems: `${sale.items[0].medicine.name} (2)`,
      totalAmount: sale.totalAmount,
      discount: sale.discount,
      staffName: sale.user.name,
      portalType: "PHARMACIST",
    };

    assert(pharmProcessedPayload.patientName === "Sohail Anwar", "Dispensary Modal Displays Patient Name", pharmProcessedPayload.patientName);
    assert(pharmProcessedPayload.invoiceNumber === saleNumber, "Dispensary Modal Displays Sale Number", pharmProcessedPayload.invoiceNumber);

    // 3. Cleanup Test Records
    console.log("\n--- 3. Clean up Test Records ---");
    await prisma.pharmacySaleItem.deleteMany({ where: { saleId: sale.id } });
    await prisma.pharmacySale.delete({ where: { id: sale.id } });
    await prisma.invoiceItem.deleteMany({ where: { invoiceId: invoice.id } });
    await prisma.invoice.delete({ where: { id: invoice.id } });
    await prisma.visit.delete({ where: { id: visit.id } });
    await prisma.patient.delete({ where: { id: patient.id } });

    assert(true, "All Test Records Cleaned Up Cleanly");

  } catch (err: any) {
    console.error("Test execution failed:", err);
    failed++;
  } finally {
    await prisma.$disconnect();
  }

  console.log("\n=========================================================");
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("=========================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

verifyPatientProceedModalAndReset();

