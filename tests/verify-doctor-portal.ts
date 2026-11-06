import { prisma } from "../src/lib/prisma";
import * as bcrypt from "bcryptjs";

async function verifyDoctorPortalAndReceptionist() {
  console.log("=========================================================");
  console.log("🩺 VERIFYING DOCTOR PORTAL & RECEPTIONIST NAME UPDATE");
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
    // 1. Receptionist Name Verification
    console.log("--- 1. Receptionist Name Update Check ---");
    const receptionist = await prisma.user.findUnique({
      where: { email: "receptionist@hms.local" },
    });

    assert(!!receptionist, "Receptionist User Exists");
    assert(
      receptionist?.name.includes("Adnan Ahmed") ?? false,
      "Receptionist Name Changed to Adnan Ahmed",
      `Actual Name: ${receptionist?.name}`
    );
    assert(receptionist?.role === "RECEPTIONIST", "Receptionist Role Configured");

    // 2. Doctor Account Verification
    console.log("\n--- 2. Doctor Account & Role Check ---");
    const doctor = await prisma.user.findUnique({
      where: { email: "doctor@hms.local" },
    });

    assert(!!doctor, "Doctor Account Exists in Database");
    assert(doctor?.role === "DOCTOR", "Doctor Role Configured", `Role: ${doctor?.role}`);
    assert(
      doctor?.name.includes("Dr. Tariq Khan") ?? false,
      "Doctor Name Configured",
      `Name: ${doctor?.name}`
    );

    const isDoctorPassValid = doctor ? await bcrypt.compare("doctor123", doctor.password) : false;
    assert(isDoctorPassValid, "Doctor Password Authentication Validated");

    // 3. Doctor Search Functionality
    console.log("\n--- 3. Doctor Patient Search Methods ---");
    // Search by Name
    const byName = await prisma.patient.findMany({
      where: { name: { contains: "Muhammad", mode: "insensitive" } },
    });
    assert(byName.length > 0, "Search by Patient Name (Muhammad)", `Found ${byName.length} matching patients`);

    // Search by UID
    const byUid = await prisma.patient.findMany({
      where: { patientUid: { contains: "PAT-2026-0001", mode: "insensitive" } },
    });
    assert(byUid.length === 1, "Search by Patient UID (PAT-2026-0001)", `Found: ${byUid[0]?.name}`);

    // Search by Phone
    const byPhone = await prisma.patient.findMany({
      where: { phone: { contains: "1234567" } },
    });
    assert(byPhone.length > 0, "Search by Phone (+92 300 1234567)", `Found: ${byPhone[0]?.name}`);

    // 4. Patient Comprehensive Medical Dossier Retrieval
    console.log("\n--- 4. Patient Medical Dossier & History Check ---");
    const testPatient = byUid[0];
    const fullPatientHistory = await prisma.patient.findUnique({
      where: { id: testPatient.id },
      include: {
        visits: {
          orderBy: { createdAt: "desc" },
          include: { invoice: true },
        },
        pharmacySales: {
          orderBy: { createdAt: "desc" },
          include: {
            items: { include: { medicine: true } },
          },
        },
        invoices: true,
      },
    });

    assert(!!fullPatientHistory, "Patient Dossier Retrieved Successfully");
    assert(fullPatientHistory!.visits.length > 0, "Clinical Visits Included in Dossier", `${fullPatientHistory!.visits.length} visits found`);
    assert(fullPatientHistory!.visits[0].diagnosis !== null, "Clinical Diagnosis Linked", `Diagnosis: ${fullPatientHistory!.visits[0].diagnosis}`);
    assert(fullPatientHistory!.visits[0].notes !== null, "Doctor Clinical Notes Linked", `Notes: ${fullPatientHistory!.visits[0].notes}`);
    assert(fullPatientHistory!.pharmacySales.length > 0, "Dispensary Medication History Linked", `${fullPatientHistory!.pharmacySales.length} pharmacy sales linked`);
    assert(fullPatientHistory!.invoices.length > 0, "Clinical Invoices Linked", `${fullPatientHistory!.invoices.length} invoices linked`);

    // 5. Doctor Clinical Findings Recording
    console.log("\n--- 5. Doctor Clinical Notes Recording Flow ---");
    const visitToUpdate = fullPatientHistory!.visits[0];
    const updatedVisit = await prisma.visit.update({
      where: { id: visitToUpdate.id },
      data: {
        diagnosis: "Acute Bronchitis & Rhinitis (Updated by Dr. Tariq)",
        notes: "Follow-up examination: Throat congestion reduced. Chest clear. Advised complete 5-day antibiotic course.",
      },
    });

    assert(
      updatedVisit.diagnosis === "Acute Bronchitis & Rhinitis (Updated by Dr. Tariq)",
      "Doctor Successfully Recorded Clinical Diagnosis"
    );

    const audit = await prisma.auditLog.create({
      data: {
        userId: doctor!.id,
        action: "CLINICAL_NOTE_RECORDED",
        details: `Dr. ${doctor?.name} updated clinical diagnosis for patient ${testPatient.name} (${testPatient.patientUid}).`,
      },
    });
    assert(!!audit.id, "Doctor Action Logged in Security Audit Trail", `Action: ${audit.action}`);

    console.log("\n=========================================================");
    console.log(`DOCTOR PORTAL VERIFICATION: ${passed} PASSED, ${failed} FAILED`);
    console.log("=========================================================");

    if (failed > 0) process.exit(1);
  } catch (e) {
    console.error("Test execution failed:", e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDoctorPortalAndReceptionist();

