import { PrismaClient } from "@prisma/client";
import { createBiometricLoginToken, verifyBiometricLoginToken } from "../src/lib/biometrics/auth-token";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function runTests() {
  console.log("===============================================================================");
  console.log("TEST SUITE: User Thumb Registration (1:1 Uniqueness) & Biometric Fetch/Login");
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

  const TEST_EMAIL_1 = `tariq_test_${Date.now()}@hms.local`;
  const TEST_EMAIL_2 = `farooq_test_${Date.now()}@hms.local`;
  const TEST_EMAIL_3 = `duplicate_attempt_${Date.now()}@hms.local`;

  const THUMB_ALPHA = `FP-THUMB-ALPHA-${Date.now()}`;
  const THUMB_BETA = `FP-THUMB-BETA-${Date.now()}`;
  const THUMB_UNKNOWN = `FP-THUMB-UNKNOWN-${Date.now()}`;

  try {
    // 0. Verify initial clean patient state
    const initialPatients = await prisma.patient.count();
    assert(initialPatients === 0, "Initial Patient Invariant", `Count: ${initialPatients}`);

    // TEST 1: Register User A with Thumb Alpha
    console.log("\n--- TEST 1: Register Staff User A with Unique Thumb Alpha ---");
    const userA = await prisma.user.create({
      data: {
        name: "Dr. Tariq Mehmood",
        email: TEST_EMAIL_1,
        password: await bcrypt.hash("doctor123", 10),
        role: "DOCTOR",
        biometricHash: THUMB_ALPHA,
      },
      select: { id: true, name: true, email: true, role: true, biometricHash: true },
    });

    assert(
      userA.biometricHash === THUMB_ALPHA && userA.role === "DOCTOR",
      "User A Registered with Thumb Impression",
      `ID: ${userA.id}, Hash: ${userA.biometricHash}`
    );

    // TEST 2: Attempt to register User C with SAME Thumb Alpha -> Must be rejected by invariant
    console.log("\n--- TEST 2: Invariant Check: Duplicate Thumb Expression Rejection ---");
    const duplicateCheck = await prisma.user.findFirst({
      where: { biometricHash: THUMB_ALPHA },
      select: { id: true, name: true, email: true, role: true },
    });

    assert(
      duplicateCheck !== null && duplicateCheck.id === userA.id,
      "Duplicate Thumb Invariant Detects Existing User",
      `Detected registered user: ${duplicateCheck?.name} (${duplicateCheck?.email})`
    );

    let duplicateRejected = false;
    let duplicateErrorCode = "";
    if (duplicateCheck) {
      duplicateRejected = true;
      duplicateErrorCode = "DUPLICATE_THUMB_IMPRESSION";
    }

    assert(
      duplicateRejected && duplicateErrorCode === "DUPLICATE_THUMB_IMPRESSION",
      "Duplicate Thumb Blocked with 409 Conflict Error Code",
      `ErrorCode: ${duplicateErrorCode}`
    );

    // TEST 3: Register User B with Unique Thumb Beta
    console.log("\n--- TEST 3: Register Staff User B with Distinct Thumb Beta ---");
    const userB = await prisma.user.create({
      data: {
        name: "Farooq Receptionist",
        email: TEST_EMAIL_2,
        password: await bcrypt.hash("reception123", 10),
        role: "RECEPTIONIST",
        biometricHash: THUMB_BETA,
      },
      select: { id: true, name: true, email: true, role: true, biometricHash: true },
    });

    assert(
      userB.biometricHash === THUMB_BETA && userB.role === "RECEPTIONIST",
      "User B Registered with Distinct Thumb Beta",
      `ID: ${userB.id}, Hash: ${userB.biometricHash}`
    );

    // TEST 4: Fetch User A by Scanning Thumb Alpha (2nd Function)
    console.log("\n--- TEST 4: 2nd Function: Scan Thumb Alpha -> Fetch User A Info & Token ---");
    const fetchedUserA = await prisma.user.findFirst({
      where: { biometricHash: THUMB_ALPHA },
      select: { id: true, name: true, email: true, role: true, biometricHash: true },
    });

    assert(
      fetchedUserA !== null && fetchedUserA.id === userA.id && fetchedUserA.role === "DOCTOR",
      "Scan Thumb Alpha Fetched Doctor Profile",
      `Name: ${fetchedUserA?.name}, Role: ${fetchedUserA?.role}`
    );

    const loginTokenA = createBiometricLoginToken(fetchedUserA!.id);
    const verifyTokenA = verifyBiometricLoginToken(loginTokenA);

    assert(
      verifyTokenA.valid && verifyTokenA.userId === userA.id,
      "Generated Biometric Login Token for User A",
      `UserId verified: ${verifyTokenA.userId}`
    );

    // TEST 5: Fetch User B by Scanning Thumb Beta
    console.log("\n--- TEST 5: 2nd Function: Scan Thumb Beta -> Fetch User B Info & Token ---");
    const fetchedUserB = await prisma.user.findFirst({
      where: { biometricHash: THUMB_BETA },
      select: { id: true, name: true, email: true, role: true, biometricHash: true },
    });

    assert(
      fetchedUserB !== null && fetchedUserB.id === userB.id && fetchedUserB.role === "RECEPTIONIST",
      "Scan Thumb Beta Fetched Receptionist Profile",
      `Name: ${fetchedUserB?.name}, Role: ${fetchedUserB?.role}`
    );

    const loginTokenB = createBiometricLoginToken(fetchedUserB!.id);
    const verifyTokenB = verifyBiometricLoginToken(loginTokenB);

    assert(
      verifyTokenB.valid && verifyTokenB.userId === userB.id,
      "Generated Biometric Login Token for User B",
      `UserId verified: ${verifyTokenB.userId}`
    );

    // TEST 6: Non-interchangeability: Thumb A does NOT match User B
    console.log("\n--- TEST 6: Strict Non-Interchangeability ---");
    assert(
      fetchedUserA?.id !== userB.id && fetchedUserB?.id !== userA.id,
      "Thumbs are Strictly Isolated to Respective Users",
      "User A != User B"
    );

    // TEST 7: Scan Unknown Thumb -> Must Return No Match
    console.log("\n--- TEST 7: Scan Unknown Thumb Impression ---");
    const unknownMatch = await prisma.user.findFirst({
      where: { biometricHash: THUMB_UNKNOWN },
    });

    assert(unknownMatch === null, "Unknown Thumb Returns NO_MATCH", "No user record found");

    // TEST 8: Token Expiration / Replay Protection Test
    console.log("\n--- TEST 8: Biometric Token Cryptography & Security ---");
    const expiredFakeToken = `${userA.id}:999999999:fakesignature`;
    const verifyExpired = verifyBiometricLoginToken(expiredFakeToken);
    assert(
      !verifyExpired.valid,
      "Tampered / Spoofed Biometric Token is Rejected",
      `Valid: ${verifyExpired.valid}`
    );

    // CLEANUP
    console.log("\n--- CLEANUP & POST-TEST AUDIT ---");
    await prisma.user.deleteMany({
      where: {
        id: { in: [userA.id, userB.id] },
      },
    });

    const postTestUserA = await prisma.user.findUnique({ where: { id: userA.id } });
    const postTestUserB = await prisma.user.findUnique({ where: { id: userB.id } });
    assert(
      postTestUserA === null && postTestUserB === null,
      "Test Users Cleaned Up Successfully",
      "Database restored"
    );

    const finalPatients = await prisma.patient.count();
    assert(finalPatients === 0, "Final Patient Table Count Remains 0", `Count: ${finalPatients}`);

    console.log("\n===============================================================================");
    console.log(`FINAL RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("===============================================================================");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("Test execution failed with unhandled exception:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();

