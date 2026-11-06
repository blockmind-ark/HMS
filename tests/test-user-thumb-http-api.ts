import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const BASE_URL = "http://127.0.0.1:3000";

async function runHttpTests() {
  console.log("===============================================================================");
  console.log("HTTP INTEGRATION TEST: User Thumb Registration & Biometric Identify API");
  console.log("===============================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail: string = "") {
    if (condition) {
      console.log(`✓ PASS: ${testName} ${detail ? `(${detail})` : ""}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${testName} ${detail ? `(${detail})` : ""}`);
      failed++;
    }
  }

  const TEST_HASH_1 = `FP-HTTP-TEST-1-${Date.now()}`;
  const TEST_HASH_2 = `FP-HTTP-TEST-2-${Date.now()}`;

  let createdUser1Id: string | null = null;

  try {
    // 1. Direct Biometric Identify against empty database
    console.log("--- 1. Identify with non-existent thumb ---");
    const resNoMatch = await fetch(`${BASE_URL}/api/auth/biometric-identify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ biometricHash: TEST_HASH_1 }),
    });

    const dataNoMatch = (await resNoMatch.json()) as any;
    assert(
      resNoMatch.status === 200 && dataNoMatch.matchFound === false,
      "Unknown Thumb Returns matchFound: false",
      `Status: ${resNoMatch.status}, matchFound: ${dataNoMatch.matchFound}`
    );

    // 2. Create User with Thumb 1 in database
    console.log("\n--- 2. Create User with Thumb 1 ---");
    const user1 = await prisma.user.create({
      data: {
        name: "Dr. Hamza Cardiologist",
        email: `hamza_${Date.now()}@hms.local`,
        password: await bcrypt.hash("doctor123", 10),
        role: "DOCTOR",
        biometricHash: TEST_HASH_1,
      },
    });
    createdUser1Id = user1.id;
    assert(!!createdUser1Id, "User 1 Created with Biometric Hash", `ID: ${user1.id}`);

    // 3. Identify User 1 via /api/auth/biometric-identify
    console.log("\n--- 3. Identify User 1 via HTTP API ---");
    const resMatch = await fetch(`${BASE_URL}/api/auth/biometric-identify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ biometricHash: TEST_HASH_1 }),
    });

    const dataMatch = (await resMatch.json()) as any;
    assert(
      resMatch.status === 200 &&
        dataMatch.matchFound === true &&
        dataMatch.user?.id === user1.id &&
        dataMatch.user?.role === "DOCTOR" &&
        !!dataMatch.loginToken,
      "Identified User 1 & Issued Biometric Login Token",
      `User: ${dataMatch.user?.name}, Role: ${dataMatch.user?.role}`
    );

    // 4. Verify NextAuth credential verification with loginToken
    console.log("\n--- 4. Verify Generated Token with NextAuth Auth Credentials Provider ---");
    const { verifyBiometricLoginToken } = require("../src/lib/biometrics/auth-token");
    const tokenCheck = verifyBiometricLoginToken(dataMatch.loginToken);
    assert(
      tokenCheck.valid === true && tokenCheck.userId === user1.id,
      "Biometric Login Token Validated Cryptographically",
      `Valid: ${tokenCheck.valid}, UserId: ${tokenCheck.userId}`
    );

    // 5. Check duplicate rejection invariant
    console.log("\n--- 5. Test Duplicate Thumb Invariant Check ---");
    const duplicateUser = await prisma.user.findFirst({
      where: { biometricHash: TEST_HASH_1 },
    });
    assert(
      duplicateUser !== null && duplicateUser.id === user1.id,
      "Database Invariant Catches Duplicate Thumb Hash",
      `Existing: ${duplicateUser?.name}`
    );

    // CLEANUP
    console.log("\n--- Cleanup ---");
    if (createdUser1Id) {
      await prisma.user.delete({ where: { id: createdUser1Id } });
    }
    const finalPatientCount = await prisma.patient.count();
    assert(finalPatientCount === 0, "Patient count invariant is 0", `Count: ${finalPatientCount}`);

    console.log("\n===============================================================================");
    console.log(`HTTP TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("===============================================================================");
    if (failed > 0) process.exit(1);
  } catch (e) {
    console.error("Test error:", e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runHttpTests();
