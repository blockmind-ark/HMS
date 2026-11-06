import { prisma } from "../src/lib/prisma";
import { generateOpdToken, getTodayTokenStatus, getTodayDateStr } from "../src/lib/tokens";

async function runTests() {
  console.log("================================================================================");
  console.log("   AUTOMATED VERIFICATION: HYBRID OPD TOKEN GENERATION & PRINT MODULE");
  console.log("   Ruqayya Hospital & Pharmacy Management System");
  console.log("================================================================================\n");

  const dateStr = getTodayDateStr();
  console.log(`📅 Today's Date String: ${dateStr}`);

  // Find a test receptionist user
  let user = await prisma.user.findFirst({
    where: { role: "RECEPTIONIST" },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: "Test Receptionist",
        email: `receptionist-token-test-${Date.now()}@hms.local`,
        password: "hashedpassword123",
        role: "RECEPTIONIST",
      },
    });
  }

  console.log(`👤 Using staff account: ${user.name} (${user.id})\n`);

  // Clean up any test tokens for today to ensure predictable sequence test
  await prisma.dailyTokenLog.deleteMany({ where: { dateStr } });
  await prisma.dailyTokenCounter.deleteMany({ where: { dateStr } });

  // 1. Initial State Check
  console.log("🧪 1. Testing Initial State & Auto-Reset...");
  const initialStatus = await getTodayTokenStatus();
  if (initialStatus.counter.lastAutoNumber !== 4) {
    throw new Error(`Expected lastAutoNumber to be 4, got ${initialStatus.counter.lastAutoNumber}`);
  }
  if (initialStatus.counter.nextAutoToken !== 5) {
    throw new Error(`Expected nextAutoToken to be 5, got ${initialStatus.counter.nextAutoToken}`);
  }
  if (initialStatus.counter.issuedManualTokens.length !== 0) {
    throw new Error(`Expected 0 issued manual tokens, got ${initialStatus.counter.issuedManualTokens.length}`);
  }
  console.log("   ✔ Initial counter initialized: lastAutoNumber=4, nextAutoToken=5, issuedManualTokens=[]\n");

  // 2. Generate Manual Reserved Token #1
  console.log("🧪 2. Generating Manual Reserved Token #1...");
  const t1 = await generateOpdToken(user.id, "MANUAL", 1);
  if (t1.tokenNumber !== 1 || t1.tokenType !== "MANUAL_RESERVED") {
    throw new Error(`Expected Token #1 MANUAL_RESERVED, got #${t1.tokenNumber} ${t1.tokenType}`);
  }
  console.log(`   ✔ Successfully issued Token #${t1.tokenNumber} (${t1.tokenType})`);

  // 3. Attempt Duplicate Manual Token #1
  console.log("🧪 3. Verifying Duplicate Manual Token Prevention...");
  let duplicatePrevented = false;
  try {
    await generateOpdToken(user.id, "MANUAL", 1);
  } catch (err: any) {
    if (err.message === "Token already issued today") {
      duplicatePrevented = true;
    } else {
      throw err;
    }
  }
  if (!duplicatePrevented) {
    throw new Error("Failed to prevent duplicate manual token #1!");
  }
  console.log("   ✔ Duplicate request correctly blocked: 'Token already issued today'\n");

  // 4. Generate Manual Reserved Token #3
  console.log("🧪 4. Generating Manual Reserved Token #3...");
  const t3 = await generateOpdToken(user.id, "MANUAL", 3);
  if (t3.tokenNumber !== 3 || t3.tokenType !== "MANUAL_RESERVED") {
    throw new Error(`Expected Token #3, got #${t3.tokenNumber}`);
  }
  console.log(`   ✔ Successfully issued Token #${t3.tokenNumber} (${t3.tokenType})`);

  // Verify counter reflects manual tokens [1, 3]
  const statusAfterManual = await getTodayTokenStatus();
  if (!statusAfterManual.counter.issuedManualTokens.includes(1) || !statusAfterManual.counter.issuedManualTokens.includes(3)) {
    throw new Error("issuedManualTokens array did not record [1, 3] properly");
  }
  console.log("   ✔ issuedManualTokens correctly contains [1, 3]\n");

  // 5. Generate First Auto Token (Must be #5)
  console.log("🧪 5. Generating First Auto Token (Must start at #5)...");
  const auto1 = await generateOpdToken(user.id, "AUTO");
  if (auto1.tokenNumber !== 5 || auto1.tokenType !== "AUTO_SEQUENCE") {
    throw new Error(`Expected Auto Token #5, got #${auto1.tokenNumber} ${auto1.tokenType}`);
  }
  console.log(`   ✔ Successfully issued first Auto Token: #${auto1.tokenNumber} (${auto1.tokenType})`);

  // 6. Generate Second Auto Token (Must be #6)
  console.log("🧪 6. Generating Second Auto Token (Must be #6)...");
  const auto2 = await generateOpdToken(user.id, "AUTO");
  if (auto2.tokenNumber !== 6 || auto2.tokenType !== "AUTO_SEQUENCE") {
    throw new Error(`Expected Auto Token #6, got #${auto2.tokenNumber}`);
  }
  console.log(`   ✔ Successfully issued second Auto Token: #${auto2.tokenNumber}\n`);

  // 7. Multi-Counter Concurrency Test
  console.log("🧪 7. Testing High Concurrency Sequence Integrity (10 parallel requests)...");
  const parallelPromises = Array.from({ length: 10 }).map(() =>
    generateOpdToken(user.id, "AUTO")
  );
  const concurrentResults = await Promise.all(parallelPromises);
  const generatedNumbers = concurrentResults.map((r) => r.tokenNumber);
  console.log(`   - Generated Token Numbers in Parallel: ${generatedNumbers.sort((a, b) => a - b).join(", ")}`);

  // Verify uniqueness (no duplicates)
  const uniqueNumbers = new Set(generatedNumbers);
  if (uniqueNumbers.size !== generatedNumbers.length) {
    throw new Error("Duplicate token numbers detected under concurrent load!");
  }
  // Verify strict range 7 to 16
  const sorted = [...generatedNumbers].sort((a, b) => a - b);
  if (sorted[0] !== 7 || sorted[sorted.length - 1] !== 16) {
    throw new Error(`Expected sequence from 7 to 16, got ${sorted[0]} to ${sorted[sorted.length - 1]}`);
  }
  console.log("   ✔ Zero duplicates, perfect consecutive sequence (7 to 16) under concurrency!\n");

  // 8. Final Status & Queue Integrity Check
  console.log("🧪 8. Checking Final Queue Status & Aggregations...");
  const finalStatus = await getTodayTokenStatus();
  console.log(`   - Total Tokens Today: ${finalStatus.stats.totalToday} (Expected: 14)`);
  console.log(`   - Auto Tokens Count: ${finalStatus.stats.autoCount} (Expected: 12)`);
  console.log(`   - Manual Tokens Count: ${finalStatus.stats.manualCount} (Expected: 2)`);
  console.log(`   - Next Auto Token will be: #${finalStatus.counter.nextAutoToken} (Expected: #17)`);

  if (finalStatus.stats.totalToday !== 14 || finalStatus.stats.autoCount !== 12 || finalStatus.stats.manualCount !== 2) {
    throw new Error("Aggregated statistics mismatch!");
  }
  if (finalStatus.counter.nextAutoToken !== 17) {
    throw new Error(`Expected nextAutoToken to be 17, got ${finalStatus.counter.nextAutoToken}`);
  }
  console.log("   ✔ All queue numbers and statistics verified.\n");

  console.log("================================================================================");
  console.log("   🎉 ALL VERIFICATION CHECKS PASSED!");
  console.log("   HYBRID OPD TOKEN GENERATION ENGINE IS FULLY TESTED & VERIFIED!");
  console.log("================================================================================\n");
}

runTests()
  .catch((e) => {
    console.error("❌ Test Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

