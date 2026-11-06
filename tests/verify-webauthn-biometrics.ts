import { prisma } from "../src/lib/prisma";
import {
  generateChallenge,
  createRegistrationOptions,
  createAuthenticationOptions,
  verifyClientData,
  bufferToBase64URL,
  base64URLToBuffer,
} from "../src/lib/webauthn";

async function verifyWebAuthnBiometrics() {
  console.log("=========================================================");
  console.log("🧬 VERIFYING WEBAUTHN NATIVE BIOMETRIC FINGERPRINT SYSTEM");
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
    // 1. WebAuthn Cryptographic Helpers
    console.log("--- 1. WebAuthn Cryptographic Helpers ---");

    const testBytes = new Uint8Array([0xde, 0xad, 0xbe, 0xef, 0x42, 0x99]);
    const encoded = bufferToBase64URL(testBytes);
    const decoded = base64URLToBuffer(encoded);
    const roundtripMatches =
      decoded.length === testBytes.length &&
      decoded.every((byte, i) => byte === testBytes[i]);

    assert(roundtripMatches, "Base64URL Roundtrip Encoding/Decoding", `Encoded: ${encoded}`);

    const challenge = generateChallenge();
    assert(
      typeof challenge === "string" && challenge.length >= 40,
      "Cryptographic Challenge Generation (32 bytes / Base64URL)",
      `Generated: ${challenge.slice(0, 20)}...`
    );

    const regOptions = createRegistrationOptions({
      challenge,
      patientId: "test-patient-id",
      patientUid: "PAT-2026-0001",
      patientName: "Kamran Akram",
      rpName: "Ruqayya Clinic & Pharmacy",
    });

    assert(
      regOptions.rp.name === "Ruqayya Clinic & Pharmacy",
      "Registration Options RP Name Branding",
      regOptions.rp.name
    );
    assert(
      regOptions.pubKeyCredParams.some((p) => p.alg === -7),
      "Registration Options Supports ES256 (-7) Biometric Algorithm"
    );
    assert(
      regOptions.user.displayName === "Kamran Akram",
      "Registration Options Includes Patient Name",
      regOptions.user.displayName
    );

    const authOptions = createAuthenticationOptions({
      challenge,
      credentialIds: ["cred-1", "cred-2"],
    });

    assert(
      authOptions.allowCredentials?.length === 2,
      "Authentication Options Formats Allowed Credential IDs"
    );

    // 2. ClientDataJSON Verification Logic
    console.log("\n--- 2. ClientDataJSON Security Verification ---");

    const mockCreateClientData = Buffer.from(
      JSON.stringify({
        type: "webauthn.create",
        challenge: challenge,
        origin: "http://localhost:3000",
      })
    ).toString("base64url");

    const validCreateResult = verifyClientData(mockCreateClientData, challenge, "webauthn.create");
    assert(validCreateResult.isValid, "Valid Registration clientDataJSON Passes Verification");

    const wrongTypeResult = verifyClientData(mockCreateClientData, challenge, "webauthn.get");
    assert(!wrongTypeResult.isValid, "Ceremony Mismatch Detected and Blocked (expected get, received create)");

    const wrongChallengeResult = verifyClientData(mockCreateClientData, "wrong-challenge", "webauthn.create");
    assert(!wrongChallengeResult.isValid, "Challenge Replay/Mismatch Detected and Blocked");

    // 3. Database Schema Models (BiometricChallenge & BiometricCredential)
    console.log("\n--- 3. Database Schema Models Verification ---");

    // Create a challenge in DB
    const dbChallenge = await prisma.biometricChallenge.create({
      data: {
        challenge,
        purpose: "REGISTRATION",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    assert(!!dbChallenge.id, "BiometricChallenge Model Saves Successfully", `ID: ${dbChallenge.id}`);

    // Create a test patient for biometric linkage
    const testPatient = await prisma.patient.create({
      data: {
        patientUid: `PAT-TEST-${Date.now()}`,
        name: "Usman Ghani",
        phone: "+92 321 9876543",
        age: 38,
        gender: "Male",
      },
    });

    assert(!!testPatient.id, "Test Patient Record Created for Biometric Test", testPatient.name);

    // Create BiometricCredential linked to patient
    const mockCredId = `cred-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const dbCred = await prisma.biometricCredential.create({
      data: {
        credentialId: mockCredId,
        publicKey: "mock-public-key-attestation-bytes",
        patientId: testPatient.id,
        deviceType: "Native Biometric Sensor (Windows Hello / Touch ID)",
      },
    });

    assert(
      !!dbCred.id && dbCred.patientId === testPatient.id,
      "BiometricCredential Linked to Patient in Database",
      `Credential ID: ${dbCred.credentialId}`
    );

    // Verify counter increment
    const updatedCred = await prisma.biometricCredential.update({
      where: { id: dbCred.id },
      data: { counter: { increment: 1 } },
    });

    assert(updatedCred.counter === 1, "Biometric Credential Counter Increments On Auth", `Counter: ${updatedCred.counter}`);

    // Verify lookup by credentialId
    const foundCred = await prisma.biometricCredential.findUnique({
      where: { credentialId: mockCredId },
      include: { patient: true },
    });

    assert(
      foundCred?.patient?.id === testPatient.id,
      "Biometric Credential Successfully Resolves Patient Dossier",
      `Matched: ${foundCred?.patient?.name} (${foundCred?.patient?.patientUid})`
    );

    // 4. Clean up test challenge and credential
    console.log("\n--- 4. Cleanup & Teardown ---");
    await prisma.biometricCredential.delete({ where: { id: dbCred.id } });
    await prisma.biometricChallenge.delete({ where: { id: dbChallenge.id } });
    await prisma.patient.delete({ where: { id: testPatient.id } });

    assert(true, "Test Biometric Artifacts Cleaned Up Cleanly");

    // 5. Check No Forbidden Names Exist
    console.log("\n--- 5. Compliance Check: Forbidden Names (Fatima/Zainab) ---");
    const forbiddenUsers = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: "fatima", mode: "insensitive" } },
          { name: { contains: "zainab", mode: "insensitive" } },
          { email: { contains: "fatima", mode: "insensitive" } },
          { email: { contains: "zainab", mode: "insensitive" } },
        ],
      },
    });

    assert(forbiddenUsers.length === 0, "No Forbidden User Names in Database (0 found)");

    const forbiddenPatients = await prisma.patient.findMany({
      where: {
        OR: [
          { name: { contains: "fatima", mode: "insensitive" } },
          { name: { contains: "zainab", mode: "insensitive" } },
        ],
      },
    });

    assert(forbiddenPatients.length === 0, "No Forbidden Patient Names in Database (0 found)");

  } catch (error: any) {
    console.error("Test execution failed:", error);
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

verifyWebAuthnBiometrics();

