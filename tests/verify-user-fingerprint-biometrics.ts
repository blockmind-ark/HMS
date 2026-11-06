import { prisma } from "../src/lib/prisma";
import {
  encryptBiometricTemplate,
  decryptBiometricTemplate,
} from "../src/lib/biometrics/encryption";
import {
  compareMinutiaeTemplates,
  MockDevelopmentScannerAdapter,
} from "../src/lib/biometrics/adapter";
import { checkBiometricRateLimit } from "../src/lib/biometrics/rate-limiter";
import { CandidateTemplate } from "../src/lib/biometrics/types";

async function verifyUserFingerprintBiometrics() {
  console.log("=========================================================");
  console.log("🔬 VERIFYING ENTERPRISE USER BIOMETRIC ENROLLMENT & 1:N LOOKUP");
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
    // 1. Cryptographic Template Encryption (AES-256-GCM)
    console.log("--- 1. Cryptographic Encryption & Template Protection ---");

    const sampleMinutiae = JSON.stringify({
      format: "ISO_19794_2_SIMULATED",
      fingerPosition: "RIGHT_INDEX",
      quality: 95,
      minutiae: [
        { x: 120, y: 150, theta: 45, type: "ENDING" },
        { x: 230, y: 310, theta: 120, type: "BIFURCATION" },
        { x: 340, y: 220, theta: 270, type: "ENDING" },
      ],
    });

    const encrypted = encryptBiometricTemplate(sampleMinutiae);
    assert(
      typeof encrypted === "string" && !encrypted.includes("ENDING") && !encrypted.includes("120"),
      "Template Encrypted with AES-256-GCM (No Plaintext Leakage)",
      `Ciphertext length: ${encrypted.length}`
    );

    const decrypted = decryptBiometricTemplate(encrypted);
    assert(decrypted === sampleMinutiae, "Authenticated Decryption Restores Original Template");

    // Tamper test
    let tamperFailed = false;
    try {
      const parsed = JSON.parse(Buffer.from(encrypted, "base64").toString("utf8"));
      parsed.ciphertext = Buffer.from("corrupted-ciphertext").toString("base64");
      const tamperedStr = Buffer.from(JSON.stringify(parsed)).toString("base64");
      decryptBiometricTemplate(tamperedStr);
    } catch {
      tamperFailed = true;
    }
    assert(tamperFailed, "Cryptographic GCM Auth Tag Rejects Tampered Templates");

    // 2. Real Minutiae Matching Algorithm (No Hash Comparisons)
    console.log("\n--- 2. Real Feature-Based Minutiae Matching Engine ---");

    const templateA = JSON.stringify({
      format: "ISO_19794_2_SIMULATED",
      fingerPosition: "RIGHT_INDEX",
      quality: 90,
      minutiae: [
        { x: 100, y: 100, theta: 40, type: "ENDING" },
        { x: 200, y: 200, theta: 80, type: "BIFURCATION" },
        { x: 300, y: 300, theta: 120, type: "ENDING" },
        { x: 400, y: 400, theta: 160, type: "BIFURCATION" },
      ],
    });

    // Template A' with slight spatial distortion (realistic live scan variance)
    const templateASlightShift = JSON.stringify({
      format: "ISO_19794_2_SIMULATED",
      fingerPosition: "RIGHT_INDEX",
      quality: 90,
      minutiae: [
        { x: 104, y: 102, theta: 42, type: "ENDING" }, // Within 25px, 30 deg
        { x: 198, y: 202, theta: 79, type: "BIFURCATION" },
        { x: 302, y: 298, theta: 122, type: "ENDING" },
        { x: 399, y: 401, theta: 158, type: "BIFURCATION" },
      ],
    });

    // Unrelated Template B
    const templateB = JSON.stringify({
      format: "ISO_19794_2_SIMULATED",
      fingerPosition: "LEFT_THUMB",
      quality: 85,
      minutiae: [
        { x: 50, y: 50, theta: 10, type: "ENDING" },
        { x: 90, y: 90, theta: 25, type: "BIFURCATION" },
        { x: 150, y: 150, theta: 200, type: "ENDING" },
      ],
    });

    const matchSame = compareMinutiaeTemplates(templateA, templateASlightShift);
    assert(
      matchSame.score >= 90,
      "Feature-Based Matching Identifies Same Finger with Realistic Variance",
      `Score: ${matchSame.score}%, Matched Points: ${matchSame.matchedPoints}`
    );

    const matchDiff = compareMinutiaeTemplates(templateA, templateB);
    assert(
      matchDiff.score < 30,
      "Feature-Based Matching Rejects Unrelated Minutiae Patterns",
      `Score: ${matchDiff.score}%`
    );

    // 3. Adapter Abstraction & Mock Identification
    console.log("\n--- 3. Adapter Layer & Ambiguity Handling ---");

    const adapter = new MockDevelopmentScannerAdapter();
    assert(adapter.isMock === true, "Adapter Identifies Explicitly as Development Mock");

    const deviceInfo = await adapter.getDeviceInfo();
    assert(deviceInfo.isMock === true, "Device Info Labels Mock Status Transparently");

    // Test 1:N search
    const candidates: CandidateTemplate[] = [
      { id: "enr-1", userId: "user-1", fingerPosition: "RIGHT_INDEX", template: templateA },
      { id: "enr-2", userId: "user-2", fingerPosition: "LEFT_THUMB", template: templateB },
    ];

    const searchResult = await adapter.match1toN(templateASlightShift, candidates);
    assert(
      searchResult.matchFound && searchResult.matchedUserId === "user-1",
      "1:N Biometric Identification Successfully Resolves Target User ID",
      `Matched User: ${searchResult.matchedUserId}, Score: ${searchResult.confidenceScore}%`
    );

    // Test Ambiguity (multiple close matches)
    const ambiguousCandidates: CandidateTemplate[] = [
      { id: "enr-1", userId: "user-1", fingerPosition: "RIGHT_INDEX", template: templateA },
      { id: "enr-2", userId: "user-2", fingerPosition: "RIGHT_INDEX", template: templateASlightShift },
    ];
    const ambiguousResult = await adapter.match1toN(templateA, ambiguousCandidates);
    assert(
      ambiguousResult.status === "UNCERTAIN_MULTIPLE_MATCHES",
      "Ambiguous Matches Flagged as UNCERTAIN (Refuses Auto-Opening Record)",
      `Status: ${ambiguousResult.status}`
    );

    // 4. Rate Limiting Logic
    console.log("\n--- 4. Rate Limiting Protection ---");
    const testKey = `test-limit-${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      checkBiometricRateLimit(testKey, 5, 10000);
    }
    const blocked = checkBiometricRateLimit(testKey, 5, 10000);
    assert(!blocked.allowed, "Rate Limiter Blocks Excessive Rapid 1:N Identification Attempts");

    // 5. Database Enrollment & User Association
    console.log("\n--- 5. PostgreSQL Database Lifecycle & Audit Events ---");

    // Create a temporary test user
    const testUser = await prisma.user.create({
      data: {
        name: "Waqas Younas",
        email: `wyounas-${Date.now()}@hms.local`,
        password: "hashedpassword123",
        role: "RECEPTIONIST",
      },
    });

    assert(!!testUser.id, "Test User Created in Database", testUser.name);

    // Enroll fingerprint
    const enrollment = await prisma.userBiometricEnrollment.create({
      data: {
        userId: testUser.id,
        fingerPosition: "RIGHT_INDEX",
        encryptedTemplate: encryptBiometricTemplate(templateA),
        qualityScore: 94,
        scannerModel: "Mock Dev Scanner v1.0",
        adapterType: "MOCK",
      },
    });

    assert(
      !!enrollment.id && enrollment.userId === testUser.id,
      "Biometric Enrollment Stored in DB Linked to User",
      `Enrollment ID: ${enrollment.id}`
    );

    // Query user with enrollment
    const fetchedUser = await prisma.user.findUnique({
      where: { id: testUser.id },
      include: { biometricEnrollments: true },
    });

    assert(
      fetchedUser?.biometricEnrollments.length === 1,
      "User Record Fetches Linked Biometric Enrollment Metadata"
    );

    // Test Deletion of Enrollment
    await prisma.userBiometricEnrollment.delete({ where: { id: enrollment.id } });
    const userAfterDelete = await prisma.user.findUnique({
      where: { id: testUser.id },
      include: { biometricEnrollments: true },
    });

    assert(
      userAfterDelete?.biometricEnrollments.length === 0,
      "Biometric Enrollment Successfully Deleted"
    );

    // Clean up test user
    await prisma.user.delete({ where: { id: testUser.id } });
    assert(true, "Test User Cleaned Up");

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

verifyUserFingerprintBiometrics();
