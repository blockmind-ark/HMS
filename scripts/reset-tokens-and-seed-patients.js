const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("=================================================");
  console.log("  HMS RESET: TOKENS & 10 PATIENTS SEED ENGINE");
  console.log("=================================================");

  // 1. Reset all Token logs and counters
  console.log("\n🧹 1. Resetting all DailyTokenLog & DailyTokenCounter records...");
  const delTokens = await prisma.dailyTokenLog.deleteMany({});
  const delCounters = await prisma.dailyTokenCounter.deleteMany({});
  console.log(`   ✔ Cleared ${delTokens.count} token logs and ${delCounters.count} token counters.`);

  // 2. Clear patient dependent records
  console.log("\n🧹 2. Clearing existing patient records and associated transactions...");
  await prisma.invoiceItem.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.visit.deleteMany({});
  await prisma.pharmacySaleItem.deleteMany({});
  await prisma.pharmacySale.deleteMany({});
  await prisma.patientBiometricEnrollment.deleteMany({});
  await prisma.biometricCredential.deleteMany({});
  const delPatients = await prisma.patient.deleteMany({});
  console.log(`   ✔ Cleared ${delPatients.count} old patients and dependencies.`);

  // 3. Prepare Date string for MR-date-5 digits
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const dateStr = `${year}${month}${day}`;

  // 4. Create 10 sample patients following MR-date-5 digits
  const samplePatients = [
    {
      name: "Muhammad Usman Khan",
      phone: "0300-1234567",
      age: 38,
      gender: "Male",
      cnic: "35201-1234567-1",
    },
    {
      name: "Ayesha Bibi",
      phone: "0321-9876543",
      age: 29,
      gender: "Female",
      cnic: "35202-9876543-2",
    },
    {
      name: "Abdul Rehman Malik",
      phone: "0333-5551234",
      age: 52,
      gender: "Male",
      cnic: "35201-5551234-3",
    },
    {
      name: "Fatima Zahra",
      phone: "0345-7778899",
      age: 24,
      gender: "Female",
      cnic: null, // Optional CNIC
    },
    {
      name: "Tariq Mahmood",
      phone: "0312-4443322",
      age: 45,
      gender: "Male",
      cnic: "35201-4443322-5",
    },
    {
      name: "Zainab Noor",
      phone: "0302-6667788",
      age: 31,
      gender: "Female",
      cnic: "35202-6667788-6",
    },
    {
      name: "Hamza Farooq",
      phone: "0308-1112233",
      age: 19,
      gender: "Male",
      cnic: null, // Optional CNIC
    },
    {
      name: "Sobia Akram",
      phone: "0315-9990011",
      age: 41,
      gender: "Female",
      cnic: "35201-9990011-8",
    },
    {
      name: "Bilal Ahmad",
      phone: "0334-2223344",
      age: 63,
      gender: "Male",
      cnic: "35201-2223344-9",
    },
    {
      name: "Maryam Sajid",
      phone: "0341-8889900",
      age: 36,
      gender: "Female",
      cnic: "35202-8889900-0",
    },
  ];

  console.log(`\n🏥 3. Seeding 10 fresh patients with rule MR-date-5 digits (MR-${dateStr}-XXXXX)...`);
  for (let i = 0; i < samplePatients.length; i++) {
    const sp = samplePatients[i];
    const patientUid = `MR-${dateStr}-${String(i + 1).padStart(5, "0")}`;
    const created = await prisma.patient.create({
      data: {
        patientUid,
        name: sp.name,
        phone: sp.phone,
        age: sp.age,
        gender: sp.gender,
        cnic: sp.cnic,
      },
    });
    console.log(`   ✔ [${i + 1}/10] ${created.patientUid} | ${created.name} | ${created.phone} | ${created.cnic || "No CNIC"}`);
  }

  // 5. Initialize fresh DailyTokenCounter for today
  const todayDateStr = `${year}-${month}-${day}`;
  const freshCounter = await prisma.dailyTokenCounter.create({
    data: {
      dateStr: todayDateStr,
      lastAutoNumber: 4,
      issuedManualTokens: [],
    },
  });
  console.log(`\n🎫 4. Initialized fresh DailyTokenCounter for date ${freshCounter.dateStr}:`);
  console.log(`   - lastAutoNumber: ${freshCounter.lastAutoNumber} (Next auto token will be #05)`);
  console.log(`   - issuedManualTokens: [] (Slots #1, #2, #3, #4 all available)`);

  console.log("\n=================================================");
  console.log("  🎉 SYSTEM RESET AND SEED COMPLETED SUCCESSFULLY!");
  console.log("=================================================");
}

main()
  .catch((e) => {
    console.error("Error executing reset & seed script:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

