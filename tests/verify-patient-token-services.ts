import { prisma } from "../src/lib/prisma";
import { generateOpdToken, getTodayTokenStatus, getTodayDateStr } from "../src/lib/tokens";

async function runTests() {
  console.log("================================================================================");
  console.log("   AUTOMATED VERIFICATION: PATIENT-LINKED OPD TOKEN & OTHER SERVICES");
  console.log("   Ruqayya Hospital & Pharmacy Management System");
  console.log("================================================================================\n");

  const dateStr = getTodayDateStr();

  // 1. Get or create staff user
  let staff = await prisma.user.findFirst({ where: { role: "RECEPTIONIST" } });
  if (!staff) {
    staff = await prisma.user.create({
      data: {
        name: "Adnan Ahmed (Receptionist)",
        email: `recep-test-${Date.now()}@hms.local`,
        password: "hash",
        role: "RECEPTIONIST",
      },
    });
  }

  // 2. Create or find test patient
  const testPhone = "03001234567";
  let patient = await prisma.patient.findFirst({ where: { phone: testPhone } });
  if (!patient) {
    patient = await prisma.patient.create({
      data: {
        name: "Muhammad Usman",
        phone: testPhone,
        age: 34,
        gender: "Male",
        patientUid: `P-${Date.now().toString().slice(-6)}`,
      },
    });
  }
  console.log(`👤 Identified Patient: ${patient.name} (${patient.patientUid}), Phone: ${patient.phone}`);

  // 3. Generate OPD Token with Patient Attached
  console.log("\n🧪 1. Generating Auto OPD Token attached to Patient...");
  const token = await generateOpdToken(staff.id, "AUTO", undefined, patient.id);
  console.log(`   ✔ Token Generated: #${token.tokenNumber} (${token.tokenType})`);
  console.log(`   ✔ Linked Patient in Token: ${token.patient?.name} (UID: ${token.patient?.patientUid})`);

  if (token.patientId !== patient.id) {
    throw new Error(`Expected token.patientId to be ${patient.id}, got ${token.patientId}`);
  }
  if (!token.patient || token.patient.name !== patient.name) {
    throw new Error("Patient relation missing on returned token result");
  }

  // 4. Verify in Database
  console.log("\n🧪 2. Verifying DailyTokenLog record in Database...");
  const dbToken = await prisma.dailyTokenLog.findUnique({
    where: { id: token.id },
    include: { patient: true, issuedBy: true },
  });
  if (!dbToken || !dbToken.patient) {
    throw new Error("Token record not found in database or patient relation missing");
  }
  console.log(`   ✔ DB Record verified: Token #${dbToken.tokenNumber} linked to Patient ${dbToken.patient.name}`);

  // 5. Issue First Service (General OPD Consultation) linked to Token
  console.log("\n🧪 3. Issuing 1st Service (General OPD Consultation) linked to Token...");
  const visit1 = await prisma.$transaction(async (tx) => {
    const v = await tx.visit.create({
      data: {
        patientId: patient.id,
        tokenId: token.id,
        serviceType: "General OPD Consultation",
        fee: 500,
      },
    });
    const inv = await tx.invoice.create({
      data: {
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}-1`,
        patientId: patient.id,
        visitId: v.id,
        tokenId: token.id,
        userId: staff.id,
        totalAmount: 500,
        status: "PAID",
        items: {
          create: [{ description: `General OPD Consultation (Token #${token.tokenNumber})`, quantity: 1, price: 500 }],
        },
      },
    });
    return { v, inv };
  });
  console.log(`   ✔ Visit 1 created: ${visit1.v.serviceType} (ID: ${visit1.v.id}, Token: ${visit1.v.tokenId})`);
  console.log(`   ✔ Invoice 1 created: ${visit1.inv.invoiceNumber} (Total: Rs. ${visit1.inv.totalAmount})`);

  // 6. Returning Patient / Subsequent Service Workflow (Ultrasound Abdomen & Pelvis)
  console.log("\n🧪 4. Testing Subsequent Service Workflow (Patient returns for Ultrasound)...");
  // Check patient's existing history
  const patientHistory = await prisma.patient.findUnique({
    where: { id: patient.id },
    include: {
      visits: { orderBy: { createdAt: "desc" } },
      invoices: { orderBy: { createdAt: "desc" } },
      tokenLogs: { orderBy: { createdAt: "desc" } },
    },
  });

  const previousVisitCount = patientHistory?.visits.length || 0;
  console.log(`   - Existing visits on file: ${previousVisitCount}`);

  // Issue 2nd service to same patient, linked to the ongoing visit trail & same token
  const visit2 = await prisma.$transaction(async (tx) => {
    const v = await tx.visit.create({
      data: {
        patientId: patient.id,
        tokenId: token.id,
        serviceType: "Ultrasound Abdomen & Pelvis",
        fee: 1500,
      },
    });
    const inv = await tx.invoice.create({
      data: {
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}-2`,
        patientId: patient.id,
        visitId: v.id,
        tokenId: token.id,
        userId: staff.id,
        totalAmount: 1500,
        status: "PAID",
        items: {
          create: [{ description: `Ultrasound Abdomen & Pelvis (Token #${token.tokenNumber})`, quantity: 1, price: 1500 }],
        },
      },
    });
    return { v, inv };
  });

  console.log(`   ✔ Subsequent Visit 2 created: ${visit2.v.serviceType}`);
  console.log(`   ✔ Subsequent Invoice 2 created: ${visit2.inv.invoiceNumber} (Total: Rs. ${visit2.inv.totalAmount})`);

  // 7. Verify unified lifelong patient history
  const updatedHistory = await prisma.patient.findUnique({
    where: { id: patient.id },
    include: {
      visits: { orderBy: { createdAt: "desc" } },
      invoices: { orderBy: { createdAt: "desc" } },
    },
  });

  if (updatedHistory?.visits.length !== previousVisitCount + 1) {
    throw new Error(`Expected ${previousVisitCount + 1} visits, got ${updatedHistory?.visits.length}`);
  }
  console.log(`   ✔ Patient lifelong visits trail updated: ${updatedHistory.visits.length} total visits on unified record!`);
  console.log(`   - 1st Visit: ${updatedHistory.visits[1]?.serviceType || "Initial"}`);
  console.log(`   - 2nd Visit: ${updatedHistory.visits[0]?.serviceType}`);

  // 8. Verify Token's linked visits & invoices
  const tokenWithServices = await prisma.dailyTokenLog.findUnique({
    where: { id: token.id },
    include: {
      visits: true,
      invoices: true,
      patient: true,
    },
  });
  if (tokenWithServices?.visits.length !== 2) {
    throw new Error(`Expected 2 visits linked to token, got ${tokenWithServices?.visits.length}`);
  }
  if (tokenWithServices?.invoices.length !== 2) {
    throw new Error(`Expected 2 invoices linked to token, got ${tokenWithServices?.invoices.length}`);
  }
  console.log(`\n   ✔ Confirmed Token #${tokenWithServices.tokenNumber} is linked to ${tokenWithServices.visits.length} clinical procedures & invoices.`);

  console.log("\n================================================================================");
  console.log("   🎉 ALL VERIFICATION CHECKS PASSED!");
  console.log("   PATIENT IDENTIFICATION, TOKEN LINKING & SUBSEQUENT SERVICES VERIFIED!");
  console.log("================================================================================\n");
}

runTests()
  .catch((e) => {
    console.error("❌ Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

