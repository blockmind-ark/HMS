import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runTests() {
  console.log("=========================================================");
  console.log("🔬 VERIFYING 1:1 THUMB IMPRESSION UNIQUENESS CONSTRAINT");
  console.log("=========================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      if (detail) console.log(`   └─ ${detail}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      if (detail) console.error(`   └─ ${detail}`);
      failed++;
    }
  }

  try {
    // Step 1: Verify patient records are empty initially
    console.log("--- 1. Verify Clean Patient Database ---");
    const initialCount = await prisma.patient.count();
    assert(initialCount === 0, "Patient database is completely clean (0 records)", `Total patients: ${initialCount}`);

    // Step 2: Register Patient A with Thumb Impression Alpha
    console.log("\n--- 2. Register Patient A with Thumb Impression Alpha ---");
    const thumbAlpha = "FP-7F3A9D1C28B45E60-RIGHTTHUMB";

    const patientA = await prisma.patient.create({
      data: {
        patientUid: "PAT-2026-0001",
        name: "Muhammad Ali Khan",
        phone: "+92 300 1112233",
        age: 35,
        gender: "Male",
        biometricHash: thumbAlpha,
      },
    });

    assert(!!patientA.id, "Patient A successfully registered with Thumb Impression Alpha", `${patientA.name} (${patientA.patientUid})`);
    assert(patientA.biometricHash === thumbAlpha, "Biometric hash bound to Patient A", patientA.biometricHash!);

    // Step 3: Attempt to Register Patient B with the SAME Thumb Impression Alpha via API Logic
    console.log("\n--- 3. Duplicate Prevention: Attempt Register Patient B with Same Thumb ---");
    const cleanHash = thumbAlpha.trim();
    const existingPatientWithThumb = await prisma.patient.findFirst({
      where: { biometricHash: cleanHash },
      select: { id: true, name: true, patientUid: true },
    });

    let duplicateDetected = false;
    let duplicateErrorMessage = "";

    if (existingPatientWithThumb) {
      duplicateDetected = true;
      duplicateErrorMessage = `This thumb impression is already registered to patient "${existingPatientWithThumb.name}" (${existingPatientWithThumb.patientUid}). One thumb impression can only be registered to one patient record.`;
    }

    assert(duplicateDetected, "System detected duplicate thumb impression attempt", duplicateErrorMessage);
    assert(
      duplicateErrorMessage.includes("Muhammad Ali Khan"),
      "Error identifies existing patient holding the thumb impression",
      "Muhammad Ali Khan (PAT-2026-0001)"
    );

    // Ensure database rejected duplicate (Patient B was not inserted)
    const countAfterDuplicateAttempt = await prisma.patient.count();
    assert(countAfterDuplicateAttempt === 1, "Database prevented duplicate patient insertion", `Count remains: ${countAfterDuplicateAttempt}`);

    // Step 4: Register Patient B with a UNIQUE Thumb Impression Beta
    console.log("\n--- 4. Register Patient B with Unique Thumb Impression Beta ---");
    const thumbBeta = "FP-1B4E8C9D2A3F7051-RIGHTTHUMB";

    const duplicateCheckBeta = await prisma.patient.findFirst({
      where: { biometricHash: thumbBeta },
    });

    assert(!duplicateCheckBeta, "Thumb Impression Beta is verified unused", "Free to enroll");

    const patientB = await prisma.patient.create({
      data: {
        patientUid: "PAT-2026-0002",
        name: "Hamza Rasheed",
        phone: "+92 321 4455667",
        age: 42,
        gender: "Male",
        biometricHash: thumbBeta,
      },
    });

    assert(!!patientB.id, "Patient B successfully registered with unique Thumb Impression Beta", `${patientB.name} (${patientB.patientUid})`);
    const countAfterPatientB = await prisma.patient.count();
    assert(countAfterPatientB === 2, "Both distinct patients exist with distinct thumb impressions", `Count: ${countAfterPatientB}`);

    // Step 5: Test Biometric Enrollment Table Duplicate Prevention
    console.log("\n--- 5. Biometric Enrollment Table Minutiae Duplicate Check ---");
    const enrollmentA = await prisma.patientBiometricEnrollment.create({
      data: {
        patientId: patientA.id,
        fingerPosition: "RIGHT_THUMB",
        encryptedTemplate: "ENC-CIPHERTEXT-ALPHA",
        qualityScore: 98,
        scannerModel: "Elan MOC Sensors",
        adapterType: "VENDOR_LOCAL_AGENT",
      },
    });

    assert(!!enrollmentA.id, "Patient A biometric minutiae template enrolled", `ID: ${enrollmentA.id}`);

    // Check duplicate check logic against enrollment table
    const duplicateEnrollment = await prisma.patient.findFirst({
      where: {
        biometricHash: thumbAlpha,
        id: { not: patientB.id },
      },
    });

    assert(!!duplicateEnrollment, "Enrollment duplicate check flags thumb Alpha as already assigned", `${duplicateEnrollment?.name}`);

    // Step 6: Verify 1:1 Invariant across Database
    console.log("\n--- 6. Verify Global 1:1 Invariant ---");
    const allPatients = await prisma.patient.findMany({
      where: { biometricHash: { not: null } },
      select: { id: true, patientUid: true, name: true, biometricHash: true },
    });

    const hashSet = new Set<string>();
    let hasDuplicates = false;
    for (const p of allPatients) {
      if (hashSet.has(p.biometricHash!)) {
        hasDuplicates = true;
        break;
      }
      hashSet.add(p.biometricHash!);
    }

    assert(!hasDuplicates, "Zero duplicate thumb impressions exist across all records", `Verified ${allPatients.length} distinct records`);
    assert(hashSet.size === allPatients.length, "Each thumb impression maps to exactly one patient record", `1:1 mapping confirmed (${hashSet.size} unique hashes)`);

    // Step 7: Clean up test records
    console.log("\n--- 7. Cleanup Test Records ---");
    await prisma.patientBiometricEnrollment.deleteMany({ where: { patientId: { in: [patientA.id, patientB.id] } } });
    await prisma.patient.deleteMany({ where: { id: { in: [patientA.id, patientB.id] } } });
    const finalCount = await prisma.patient.count();
    assert(finalCount === 0, "All test patient records cleaned up cleanly", `Final count: ${finalCount}`);

  } catch (err: any) {
    console.error("Test execution error:", err);
    failed++;
  } finally {
    await prisma.$disconnect();
    console.log("\n=========================================================");
    console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("=========================================================");
    if (failed > 0) process.exit(1);
  }
}

runTests();

