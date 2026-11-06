import { prisma } from "../src/lib/prisma";
import {
  encryptBiometricTemplate,
  decryptBiometricTemplate,
} from "../src/lib/biometrics/encryption";
import {
  compareMinutiaeTemplates,
  MockDevelopmentScannerAdapter,
} from "../src/lib/biometrics/adapter";
import { CandidateTemplate } from "../src/lib/biometrics/types";

async function verifyReturningPatientThumbprint() {
  console.log("=========================================================");
  console.log("🧬 VERIFYING RETURNING PATIENT THUMB SCAN & DOSSIER FETCH");
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
    // 0. Clean up any previous test patient records & enrollments
    await prisma.patientBiometricEnrollment.deleteMany({
      where: {
        patient: {
          patientUid: { startsWith: "PAT-RETURNING-" }
        }
      }
    });

    // 1. Create Old / Returning Patient with Medical & Financial History
    console.log("--- 1. Seed Returning Patient with Clinical History ---");

    const patientUid = `PAT-RETURNING-${Date.now()}`;
    const patient = await prisma.patient.create({
      data: {
        patientUid,
        name: "Hamza Rasheed",
        phone: "+92 301 5566778",
        age: 45,
        gender: "Male",
        biometricHash: "THUMB-ISO-RIGHT_THUMB",
      },
    });

    assert(!!patient.id, "Returning Patient Record Created", `${patient.name} (${patient.patientUid})`);

    // Add Past Clinical Visit with Doctor's Diagnosis & Notes
    const visit = await prisma.visit.create({
      data: {
        patientId: patient.id,
        serviceType: "Consultation & Ultrasound",
        fee: 1500.0,
        diagnosis: "Fatty Liver Grade 1 & Acid Peptic Disease",
        notes: "Advised dietary control, lifestyle modification, and follow-up abdominal ultrasound in 3 months.",
      },
    });

    assert(!!visit.id, "Past Clinical Visit & Doctor Notes Attached", visit.diagnosis || "");

    // Add Invoice
    const defaultUser = await prisma.user.findFirst();
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-TEST-${Date.now()}`,
        patientId: patient.id,
        visitId: visit.id,
        userId: defaultUser?.id || "admin-id",
        totalAmount: 1500.0,
        status: "PAID",
        items: {
          create: [
            { description: "Specialist Physician Consultation", quantity: 1, price: 1000.0 },
            { description: "Abdominal Ultrasound (USG)", quantity: 1, price: 500.0 },
          ],
        },
      },
    });

    assert(!!invoice.id, "Past Clinical Invoice & Receipts Attached", invoice.invoiceNumber);

    // 2. Enroll Patient's Thumbprint (ISO 19794-2 Encrypted Minutiae)
    console.log("\n--- 2. Enroll Patient Thumbprint (Right Thumb) ---");

    const patientThumbTemplate = JSON.stringify({
      format: "ISO_19794_2_SIMULATED",
      fingerPosition: "RIGHT_THUMB",
      quality: 95,
      minutiae: [
        { x: 165, y: 175, theta: 42, type: "ENDING" },
        { x: 245, y: 295, theta: 98, type: "BIFURCATION" },
        { x: 345, y: 225, theta: 245, type: "ENDING" },
        { x: 415, y: 355, theta: 152, type: "BIFURCATION" },
        { x: 280, y: 240, theta: 80, type: "ENDING" },
      ],
    });

    const encryptedTemplate = encryptBiometricTemplate(patientThumbTemplate);

    const enrollment = await prisma.patientBiometricEnrollment.create({
      data: {
        patientId: patient.id,
        fingerPosition: "RIGHT_THUMB",
        encryptedTemplate,
        qualityScore: 95,
        scannerModel: "Optical USB Fingerprint Scanner",
        adapterType: "MOCK",
        enrolledById: defaultUser?.id,
      },
    });

    assert(
      !!enrollment.id && enrollment.patientId === patient.id,
      "PatientBiometricEnrollment Saved with AES-256-GCM Encryption",
      `Enrollment ID: ${enrollment.id}`
    );

    // 3. Simulate Returning Patient Scanning Thumb on Scanner
    console.log("\n--- 3. Patient Returns: Receptionist Scans Thumb ---");

    // Scanner produces probe template (slight rotation/displacement within sensor tolerance)
    const probeLiveThumbScan = JSON.stringify({
      format: "ISO_19794_2_SIMULATED",
      fingerPosition: "RIGHT_THUMB",
      quality: 93,
      minutiae: [
        { x: 168, y: 177, theta: 44, type: "ENDING" },
        { x: 242, y: 298, theta: 96, type: "BIFURCATION" },
        { x: 348, y: 222, theta: 248, type: "ENDING" },
        { x: 412, y: 358, theta: 150, type: "BIFURCATION" },
        { x: 278, y: 242, theta: 82, type: "ENDING" },
      ],
    });

    // Fetch all enrolled templates from database
    const allPatientEnrollments = await prisma.patientBiometricEnrollment.findMany();
    const candidateTemplates: CandidateTemplate[] = [];

    for (const enr of allPatientEnrollments) {
      const decrypted = decryptBiometricTemplate(enr.encryptedTemplate);
      candidateTemplates.push({
        id: enr.id,
        userId: enr.patientId,
        fingerPosition: enr.fingerPosition as any,
        template: decrypted,
      });
    }

    const adapter = new MockDevelopmentScannerAdapter();
    const matchResult = await adapter.match1toN(probeLiveThumbScan, candidateTemplates);

    assert(
      matchResult.matchFound && matchResult.matchedUserId === patient.id,
      "1:N Biometric Search Matches Returning Patient's Thumbprint",
      `Confidence: ${matchResult.confidenceScore}%, Matched Patient ID: ${matchResult.matchedUserId}`
    );

    // 4. Verify Complete Patient Dossier Fetch
    console.log("\n--- 4. Verify Automatic Dossier & Clinical History Fetch ---");

    const fetchedDossier = await prisma.patient.findUnique({
      where: { id: matchResult.matchedUserId },
      include: {
        visits: {
          orderBy: { createdAt: "desc" },
          include: { invoice: true },
        },
        invoices: {
          orderBy: { createdAt: "desc" },
          include: { items: true },
        },
        pharmacySales: true,
        biometricEnrollments: true,
      },
    });

    assert(!!fetchedDossier, "Complete Patient Record Loaded from Database");
    assert(fetchedDossier?.name === "Hamza Rasheed", "Patient Name Correctly Resolved", fetchedDossier?.name);
    assert(fetchedDossier?.patientUid === patientUid, "Patient UID Verified", fetchedDossier?.patientUid);
    assert(fetchedDossier?.visits.length === 1, "Patient Past Visits Count Verified", `${fetchedDossier?.visits.length} visit`);
    assert(
      fetchedDossier?.visits[0].diagnosis === "Fatty Liver Grade 1 & Acid Peptic Disease",
      "Doctor Clinical Diagnosis & Notes Accessible",
      fetchedDossier?.visits[0].diagnosis || ""
    );
    assert(fetchedDossier?.invoices.length === 1, "Previous Invoices & Invoiced Amount Accessible", `Rs. ${fetchedDossier?.invoices[0].totalAmount}`);

    // 5. Cleanup Test Artifacts
    console.log("\n--- 5. Cleanup Test Patient Artifacts ---");
    await prisma.patientBiometricEnrollment.deleteMany({ where: { patientId: patient.id } });
    await prisma.invoiceItem.deleteMany({ where: { invoiceId: invoice.id } });
    await prisma.invoice.delete({ where: { id: invoice.id } });
    await prisma.visit.delete({ where: { id: visit.id } });
    await prisma.patient.delete({ where: { id: patient.id } });

    assert(true, "Test Patient Artifacts Cleaned Up Cleanly");

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

verifyReturningPatientThumbprint();

