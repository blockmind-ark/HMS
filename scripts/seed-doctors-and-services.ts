import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Doctors, Ultrasound Services, and Token Services...");

  // 1. Ultrasound Services
  const ultrasoundServices = [
    { id: "us-abdomen", name: "Ultrasound Abdomen", price: 700.0, isActive: true },
    { id: "us-tvs", name: "Ultrasound TVS", price: 1200.0, isActive: true },
    { id: "us-lks", name: "Ultrasound Liver, Kidney & Stomach", price: 1200.0, isActive: true },
  ];

  for (const s of ultrasoundServices) {
    await prisma.ultrasoundService.upsert({
      where: { name: s.name },
      update: { price: s.price, isActive: s.isActive },
      create: s,
    });
  }
  console.log("✔ Ultrasound Services seeded.");

  // 2. Token Services & Fees
  const tokenServices = [
    { id: "tok-opd", name: "OPD Fees", fee: 300.0, isActive: true },
    { id: "tok-sugar", name: "Sugar Test", fee: 100.0, isActive: true },
  ];

  for (const t of tokenServices) {
    await prisma.tokenService.upsert({
      where: { name: t.name },
      update: { fee: t.fee, isActive: t.isActive },
      create: t,
    });
  }
  console.log("✔ Token Services & Fees seeded.");

  // 3. Doctors
  // Link doctor user if exists
  const doctorUser = await prisma.user.findFirst({
    where: { email: "doctor@hms.com" },
  });

  const doctors = [
    {
      id: "doc-tariq",
      name: "Dr. Tariq Mahmood",
      specialization: "Consultant Sonologist & Radiologist",
      phone: "0300-4567891",
      email: "tariq.sonology@ruqayya.com",
      baseSalary: 180000.0,
      payType: "MONTHLY",
      perPatientShare: 200.0,
      isActive: true,
      userId: doctorUser?.id || null,
    },
    {
      id: "doc-ayesha",
      name: "Dr. Ayesha Khan",
      specialization: "General Physician & OPD Consultant",
      phone: "0321-7654321",
      email: "ayesha.opd@ruqayya.com",
      baseSalary: 150000.0,
      payType: "MONTHLY",
      perPatientShare: 150.0,
      isActive: true,
      userId: null,
    },
    {
      id: "doc-fatima",
      name: "Dr. Fatima Noor",
      specialization: "Gynecologist & Obstetrician",
      phone: "0333-9876543",
      email: "fatima.gynae@ruqayya.com",
      baseSalary: 190000.0,
      payType: "MONTHLY",
      perPatientShare: 250.0,
      isActive: true,
      userId: null,
    },
    {
      id: "doc-imran",
      name: "Dr. Imran Sarwar",
      specialization: "Pediatrician & Child Specialist",
      phone: "0345-1234567",
      email: "imran.peds@ruqayya.com",
      baseSalary: 160000.0,
      payType: "MONTHLY",
      perPatientShare: 150.0,
      isActive: true,
      userId: null,
    },
  ];

  for (const doc of doctors) {
    await prisma.doctor.upsert({
      where: { id: doc.id },
      update: {
        name: doc.name,
        specialization: doc.specialization,
        phone: doc.phone,
        email: doc.email,
        baseSalary: doc.baseSalary,
        payType: doc.payType,
        perPatientShare: doc.perPatientShare,
        isActive: doc.isActive,
        userId: doc.userId,
      },
      create: doc,
    });
  }
  console.log("✔ Doctors seeded and linked.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
