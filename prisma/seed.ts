import { PrismaClient, Role, ApprovalStatus, ShiftStatus, PaymentStatus, PurchaseOrderStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { seedInventoryPurchases } from "./seed-inventory";
import { seed289MedicinesTs } from "./seed-medicines-289";
import { syncPosCatalogFromInventory } from "./sync-pos-catalog";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Ruqayya Clinic & Pharmacy database (Pakistani PKR & Users)...");

  // 1. Clean existing data in reverse order of foreign key relationships
  await prisma.medicineInventory.deleteMany();
  await prisma.inventoryPurchase.deleteMany();
  await prisma.vendorPayment.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.shiftClosing.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.approvalRequest.deleteMany();
  await prisma.pharmacySaleItem.deleteMany();
  await prisma.pharmacySale.deleteMany();
  await prisma.stockBatch.deleteMany();
  await prisma.medicine.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();

  // 2. Role-Based Production Users with Hashed Passwords
  console.log("Seeding production role-based credentials...");

  const adminPassword = await bcrypt.hash("AdminPass123!", 10);
  const receptionistPassword = await bcrypt.hash("ReceptionPass123!", 10);
  const pharmacistPassword = await bcrypt.hash("PharmaPass123!", 10);
  const doctorPassword = await bcrypt.hash("DoctorPass123!", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Hospital Administrator",
      email: "admin@hms.com",
      password: adminPassword,
      displayPassword: "AdminPass123!",
      role: Role.ADMIN,
    },
  });

  const receptionist = await prisma.user.create({
    data: {
      name: "Front Desk Receptionist",
      email: "reception@hms.com",
      password: receptionistPassword,
      displayPassword: "ReceptionPass123!",
      role: Role.RECEPTIONIST,
    },
  });

  const pharmacist = await prisma.user.create({
    data: {
      name: "Dispensary Pharmacist",
      email: "pharma@hms.com",
      password: pharmacistPassword,
      displayPassword: "PharmaPass123!",
      role: Role.PHARMACIST,
    },
  });

  const doctor = await prisma.user.create({
    data: {
      name: "Dr. Tariq Khan (Physician)",
      email: "doctor@hms.com",
      password: doctorPassword,
      displayPassword: "DoctorPass123!",
      role: Role.DOCTOR,
    },
  });

  // Also seed legacy aliases for backward test compatibility
  const legacyAdminPassword = await bcrypt.hash("admin123", 10);
  const legacyReceptionistPassword = await bcrypt.hash("reception123", 10);
  const legacyPharmacistPassword = await bcrypt.hash("pharma123", 10);
  const legacyDoctorPassword = await bcrypt.hash("doctor123", 10);

  await prisma.user.createMany({
    data: [
      {
        name: "Abu Bakar (Admin)",
        email: "admin@hms.local",
        password: legacyAdminPassword,
        displayPassword: "admin123",
        role: Role.ADMIN,
      },
      {
        name: "Adnan Ahmed",
        email: "receptionist@hms.local",
        password: legacyReceptionistPassword,
        displayPassword: "reception123",
        role: Role.RECEPTIONIST,
      },
      {
        name: "Muhammad Tariq",
        email: "pharmacist@hms.local",
        password: legacyPharmacistPassword,
        displayPassword: "pharma123",
        role: Role.PHARMACIST,
      },
      {
        name: "Dr. Usman",
        email: "doctor@hms.local",
        password: legacyDoctorPassword,
        displayPassword: "doctor123",
        role: Role.DOCTOR,
      },
    ],
  });

  console.log("✔ Created Production Role Users:");
  console.log("  [ADMIN]        Email: admin@hms.com     | Password: AdminPass123!");
  console.log("  [RECEPTIONIST] Email: reception@hms.com | Password: ReceptionPass123!");
  console.log("  [PHARMACIST]   Email: pharma@hms.com    | Password: PharmaPass123!");
  console.log("  [DOCTOR]       Email: doctor@hms.com    | Password: DoctorPass123!");

  // 3. Patients (Pakistani Demographics)
  const patient1 = await prisma.patient.create({
    data: {
      patientUid: "PAT-2026-0001",
      name: "Muhammad Ali Khan",
      phone: "+92 300 1234567",
      age: 42,
      gender: "Male",
      biometricHash: "FP-B8D29F34C890123A-RINDEX",
    },
  });

  const patient2 = await prisma.patient.create({
    data: {
      patientUid: "PAT-2026-0002",
      name: "Ayesha Siddiqui",
      phone: "+92 321 9876543",
      age: 29,
      gender: "Female",
      biometricHash: "FP-A117C642D082341F-RTHUMB",
    },
  });

  const patient3 = await prisma.patient.create({
    data: {
      patientUid: "PAT-2026-0003",
      name: "Abdul Rehman",
      phone: "+92 312 4455667",
      age: 58,
      gender: "Male",
      biometricHash: "FP-D7C4910EE3876B12-LINDEX",
    },
  });

  const patient4 = await prisma.patient.create({
    data: {
      patientUid: "PAT-2026-0004",
      name: "Maryam Bibi",
      phone: "+92 333 4567890",
      age: 24,
      gender: "Female",
      biometricHash: "FP-E5528A1C099411BC-RTHUMB",
    },
  });

  console.log("Created 4 sample patients with Pakistani profiles");

  // 4. Clinical Visits & Sequential Invoices in Rupees (PKR)
  const visit1 = await prisma.visit.create({
    data: {
      patientId: patient1.id,
      serviceType: "OPD Consultation",
      fee: 500.0,
      diagnosis: "Acute Upper Respiratory Tract Infection (URTI)",
      notes: "Patient presented with dry cough and throat irritation for 3 days. Chest clear on auscultation. Advised Panadol Extra and warm fluids.",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000 * 2), // 2 days ago
    },
  });

  await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2026-0001",
      patientId: patient1.id,
      visitId: visit1.id,
      userId: receptionist.id,
      totalAmount: 500.0,
      discount: 0,
      status: "PAID",
      createdAt: visit1.createdAt,
      items: {
        create: [
          {
            description: "General OPD Consultation Fee",
            quantity: 1,
            price: 500.0,
          },
        ],
      },
    },
  });

  const visit2 = await prisma.visit.create({
    data: {
      patientId: patient2.id,
      serviceType: "Ultrasound Abdomen & Pelvis",
      fee: 1500.0,
      diagnosis: "Normal study - No cholelithiasis or renal calculi noted",
      notes: "Routine abdominal ultrasound. Liver, gall bladder, kidneys, and pelvic organs within normal limits. Dietary counselling provided.",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000 * 1), // 1 day ago
    },
  });

  await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2026-0002",
      patientId: patient2.id,
      visitId: visit2.id,
      userId: receptionist.id,
      totalAmount: 1500.0,
      discount: 0,
      status: "PAID",
      createdAt: visit2.createdAt,
      items: {
        create: [
          {
            description: "Pelvic & Abdominal Ultrasound Scan",
            quantity: 1,
            price: 1500.0,
          },
        ],
      },
    },
  });

  const visit3 = await prisma.visit.create({
    data: {
      patientId: patient3.id,
      serviceType: "Specialist Cardiology Consultation",
      fee: 1200.0,
      diagnosis: "Essential Hypertension (Stage 1)",
      notes: "BP 145/92 mmHg, Pulse 78 bpm. Heart sounds regular S1 S2. Prescribed lifestyle modification, reduced sodium, and 2-week review.",
      createdAt: new Date(), // Today
    },
  });

  await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2026-0003",
      patientId: patient3.id,
      visitId: visit3.id,
      userId: receptionist.id,
      totalAmount: 1100.0,
      discount: 100.0,
      status: "PAID",
      createdAt: visit3.createdAt,
      items: {
        create: [
          {
            description: "Cardiology Specialist Consultation",
            quantity: 1,
            price: 1200.0,
          },
        ],
      },
    },
  });

  // 5. Medicines Formulary (Pricing in Rupees)
  const medicinesData = [
    { name: "Paracetamol 500mg", genericName: "Paracetamol", category: "Analgesics", threshold: 25 },
    { name: "Panadol Extra", genericName: "Paracetamol + Caffeine", category: "Analgesics", threshold: 20 },
    { name: "Amoxicillin 500mg", genericName: "Amoxicillin", category: "Antibiotics", threshold: 15 },
    { name: "Augmentin 625mg", genericName: "Amoxicillin + Clavulanate", category: "Antibiotics", threshold: 10 },
    { name: "Omeprazole 20mg", genericName: "Omeprazole", category: "Gastrointestinal", threshold: 20 },
    { name: "Risek 40mg", genericName: "Omeprazole", category: "Gastrointestinal", threshold: 15 },
    { name: "Metformin 500mg", genericName: "Metformin HCl", category: "Antidiabetic", threshold: 30 },
    { name: "Glucophage 1000mg", genericName: "Metformin HCl", category: "Antidiabetic", threshold: 15 },
    { name: "Brufen 400mg", genericName: "Ibuprofen", category: "NSAID", threshold: 20 },
    { name: "Ciprofloxacin 500mg", genericName: "Ciprofloxacin", category: "Antibiotics", threshold: 12 },
    { name: "Atorvastatin 20mg", genericName: "Atorvastatin", category: "Cardiovascular", threshold: 10 },
    { name: "Cetirizine 10mg", genericName: "Cetirizine", category: "Antihistamine", threshold: 20 },
  ];

  const createdMedicines: Record<string, any> = {};
  for (const med of medicinesData) {
    const created = await prisma.medicine.create({ data: med });
    createdMedicines[med.name] = created;
  }

  // 6. Stock Batches in Rupees (PKR)
  // Paracetamol
  await prisma.stockBatch.create({
    data: {
      medicineId: createdMedicines["Paracetamol 500mg"].id,
      batchNumber: "PARA-2026-A1",
      quantity: 150,
      purchasePrice: 25.0,
      sellingPrice: 40.0,
      mfgDate: new Date("2026-01-15"),
      expiryDate: new Date("2028-01-15"),
      approvalStatus: ApprovalStatus.APPROVED,
    },
  });

  // Panadol Extra
  await prisma.stockBatch.create({
    data: {
      medicineId: createdMedicines["Panadol Extra"].id,
      batchNumber: "PAN-2026-04",
      quantity: 85,
      purchasePrice: 35.0,
      sellingPrice: 60.0,
      mfgDate: new Date("2026-02-10"),
      expiryDate: new Date("2027-12-31"),
      approvalStatus: ApprovalStatus.APPROVED,
    },
  });

  // Amoxicillin (LOW STOCK on purpose to trigger alerts!)
  await prisma.stockBatch.create({
    data: {
      medicineId: createdMedicines["Amoxicillin 500mg"].id,
      batchNumber: "AMX-2025-99",
      quantity: 8, // below threshold 15!
      purchasePrice: 140.0,
      sellingPrice: 220.0,
      mfgDate: new Date("2025-11-01"),
      expiryDate: new Date("2027-06-30"),
      approvalStatus: ApprovalStatus.APPROVED,
    },
  });

  // Augmentin 625mg
  await prisma.stockBatch.create({
    data: {
      medicineId: createdMedicines["Augmentin 625mg"].id,
      batchNumber: "AUG-2026-11",
      quantity: 40,
      purchasePrice: 280.0,
      sellingPrice: 420.0,
      mfgDate: new Date("2026-03-01"),
      expiryDate: new Date("2028-03-01"),
      approvalStatus: ApprovalStatus.APPROVED,
    },
  });

  // Omeprazole 20mg
  await prisma.stockBatch.create({
    data: {
      medicineId: createdMedicines["Omeprazole 20mg"].id,
      batchNumber: "OME-2026-01",
      quantity: 120,
      purchasePrice: 90.0,
      sellingPrice: 160.0,
      mfgDate: new Date("2026-01-01"),
      expiryDate: new Date("2028-01-01"),
      approvalStatus: ApprovalStatus.APPROVED,
    },
  });

  // Risek 40mg (LOW STOCK on purpose)
  await prisma.stockBatch.create({
    data: {
      medicineId: createdMedicines["Risek 40mg"].id,
      batchNumber: "RSK-2026-09",
      quantity: 6, // below threshold 15!
      purchasePrice: 240.0,
      sellingPrice: 380.0,
      mfgDate: new Date("2026-01-10"),
      expiryDate: new Date("2027-10-10"),
      approvalStatus: ApprovalStatus.APPROVED,
    },
  });

  // Metformin 500mg
  await prisma.stockBatch.create({
    data: {
      medicineId: createdMedicines["Metformin 500mg"].id,
      batchNumber: "MET-2026-03",
      quantity: 200,
      purchasePrice: 45.0,
      sellingPrice: 80.0,
      mfgDate: new Date("2026-01-20"),
      expiryDate: new Date("2028-06-20"),
      approvalStatus: ApprovalStatus.APPROVED,
    },
  });

  // Atorvastatin 20mg
  await prisma.stockBatch.create({
    data: {
      medicineId: createdMedicines["Atorvastatin 20mg"].id,
      batchNumber: "ATV-2026-01",
      quantity: 90,
      purchasePrice: 180.0,
      sellingPrice: 310.0,
      mfgDate: new Date("2026-02-15"),
      expiryDate: new Date("2028-02-15"),
      approvalStatus: ApprovalStatus.APPROVED,
    },
  });

  // Cetirizine 10mg
  await prisma.stockBatch.create({
    data: {
      medicineId: createdMedicines["Cetirizine 10mg"].id,
      batchNumber: "CET-2026-88",
      quantity: 110,
      purchasePrice: 40.0,
      sellingPrice: 75.0,
      mfgDate: new Date("2026-01-05"),
      expiryDate: new Date("2028-01-05"),
      approvalStatus: ApprovalStatus.APPROVED,
    },
  });

  // PENDING BATCH - Ready for Admin Approval Center!
  const pendingBatch = await prisma.stockBatch.create({
    data: {
      medicineId: createdMedicines["Amoxicillin 500mg"].id,
      batchNumber: "AMX-2026-RESTOCK",
      quantity: 100,
      purchasePrice: 130.0,
      sellingPrice: 220.0,
      mfgDate: new Date("2026-04-01"),
      expiryDate: new Date("2028-04-01"),
      approvalStatus: ApprovalStatus.PENDING,
    },
  });

  // Approval Request matching pending batch
  await prisma.approvalRequest.create({
    data: {
      type: "INVENTORY_ADD",
      details: JSON.stringify({
        medicineName: "Amoxicillin 500mg",
        batchNumber: "AMX-2026-RESTOCK",
        quantity: 100,
        purchasePrice: 130.0,
        sellingPrice: 220.0,
        mfgDate: "2026-04-01",
        expiryDate: "2028-04-01",
        reason: "Stock depleted below minimum threshold of 15 units. Urgent restock from Lahore distributor.",
        batchId: pendingBatch.id,
      }),
      requestedById: pharmacist.id,
      status: ApprovalStatus.PENDING,
      comment: null,
    },
  });

  // An already APPROVED request for historical records
  await prisma.approvalRequest.create({
    data: {
      type: "PURCHASE_ORDER",
      details: JSON.stringify({
        medicineName: "Metformin 500mg",
        batchNumber: "MET-2026-03",
        quantity: 200,
        purchasePrice: 45.0,
        sellingPrice: 80.0,
        supplier: "Punjab Pharma Distributors",
      }),
      requestedById: pharmacist.id,
      status: ApprovalStatus.APPROVED,
      comment: "Approved by Abu Bakar. Restock verified.",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  // 7. Pharmacy Sales in Rupees (with 5% generic discount)
  // Sale 1: Linked to patient 1 (Amoxicillin 3 units @ Rs. 220 = Rs. 660, 5% discount = Rs. 33 -> Net Rs. 627)
  await prisma.pharmacySale.create({
    data: {
      saleNumber: "POS-2026-0001",
      patientId: patient1.id,
      userId: pharmacist.id,
      totalAmount: 627.0,
      discount: 33.0,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000 * 2),
      items: {
        create: [
          {
            medicineId: createdMedicines["Amoxicillin 500mg"].id,
            quantity: 3,
            unitPrice: 220.0,
            totalPrice: 660.0,
          },
        ],
      },
    },
  });

  // Sale 2: Walk-in customer (Panadol Extra 2x60=120 + Atorvastatin 2x310=620 = 740, discount Rs. 30 -> Net Rs. 710)
  await prisma.pharmacySale.create({
    data: {
      saleNumber: "POS-2026-0002",
      patientId: null,
      userId: pharmacist.id,
      totalAmount: 710.0,
      discount: 30.0,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000 * 1),
      items: {
        create: [
          {
            medicineId: createdMedicines["Panadol Extra"].id,
            quantity: 2,
            unitPrice: 60.0,
            totalPrice: 120.0,
          },
          {
            medicineId: createdMedicines["Atorvastatin 20mg"].id,
            quantity: 2,
            unitPrice: 310.0,
            totalPrice: 620.0,
          },
        ],
      },
    },
  });

  // Sale 3: Linked to patient 3 (Augmentin 2x420=840 + Paracetamol 4x40=160 = 1000, 5% discount on generic Paracetamol = Rs. 8 -> Net Rs. 992)
  await prisma.pharmacySale.create({
    data: {
      saleNumber: "POS-2026-0003",
      patientId: patient3.id,
      userId: pharmacist.id,
      totalAmount: 992.0,
      discount: 8.0,
      createdAt: new Date(),
      items: {
        create: [
          {
            medicineId: createdMedicines["Augmentin 625mg"].id,
            quantity: 2,
            unitPrice: 420.0,
            totalPrice: 840.0,
          },
          {
            medicineId: createdMedicines["Paracetamol 500mg"].id,
            quantity: 4,
            unitPrice: 40.0,
            totalPrice: 160.0,
          },
        ],
      },
    },
  });

  // 8. Vendors & Purchase Orders
  const getz = await prisma.vendor.create({
    data: {
      name: "Getz Pharma Distribution Network",
      contactPerson: "Tariq Mehmood (Supply Chain Manager)",
      phone: "+92 21 3865 0001",
      email: "supply@getzpharma.pk",
      address: "Plot 29-30/27, Korangi Industrial Area, Karachi",
      balance: 65000.0,
      purchaseOrders: {
        create: [
          {
            poNumber: "PO-2026-0001",
            totalAmount: 85000.0,
            paidAmount: 20000.0,
            status: PurchaseOrderStatus.DELIVERED,
            paymentStatus: PaymentStatus.PARTIAL,
            notes: "Monthly bulk order for OPD dispensary & antibiotics stock.",
            items: {
              create: [
                { medicineName: "Paracetamol 500mg (Panadol)", quantity: 200, unitPrice: 150.0, totalPrice: 30000.0 },
                { medicineName: "Amoxicillin 500mg Caps", quantity: 100, unitPrice: 350.0, totalPrice: 35000.0 },
                { medicineName: "Omeprazole 20mg (Risek)", quantity: 100, unitPrice: 200.0, totalPrice: 20000.0 },
              ],
            },
          },
        ],
      },
    },
  });

  const po1 = await prisma.purchaseOrder.findFirst({ where: { poNumber: "PO-2026-0001" } });
  if (po1) {
    await prisma.vendorPayment.create({
      data: {
        paymentNumber: "VP-2026-0001",
        vendorId: getz.id,
        purchaseOrderId: po1.id,
        amount: 20000.0,
        paymentMethod: "Bank Transfer",
        referenceNumber: "MEZN-PK-982141",
        notes: "Advance payment 25% via Meezan Bank online transfer.",
        paidById: admin.id,
        paymentDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    });
  }

  const hilton = await prisma.vendor.create({
    data: {
      name: "Hilton Pharma Supply Division",
      contactPerson: "Kamran Baig (Accounts Officer)",
      phone: "+92 42 3578 4412",
      email: "orders@hiltonpharma.com.pk",
      address: "14-KM Multan Road, Lahore",
      balance: 42500.0,
      purchaseOrders: {
        create: [
          {
            poNumber: "PO-2026-0002",
            totalAmount: 42500.0,
            paidAmount: 0.0,
            status: PurchaseOrderStatus.DELIVERED,
            paymentStatus: PaymentStatus.UNPAID,
            notes: "Cardiovascular & antidiabetic medicines batch replenishment.",
            items: {
              create: [
                { medicineName: "Metformin 500mg Tablets", quantity: 150, unitPrice: 150.0, totalPrice: 22500.0 },
                { medicineName: "Atorvastatin 20mg Tablets", quantity: 80, unitPrice: 250.0, totalPrice: 20000.0 },
              ],
            },
          },
        ],
      },
    },
  });

  const searle = await prisma.vendor.create({
    data: {
      name: "The Searle Company Ltd. Logistics",
      contactPerson: "Zeeshan Siddiqui (Regional Distributor)",
      phone: "+92 51 4432 9988",
      email: "billing@searlecompany.com",
      address: "I-9 Industrial Area, Islamabad",
      balance: 18200.0,
      purchaseOrders: {
        create: [
          {
            poNumber: "PO-2026-0003",
            totalAmount: 58200.0,
            paidAmount: 40000.0,
            status: PurchaseOrderStatus.DELIVERED,
            paymentStatus: PaymentStatus.PARTIAL,
            notes: "Respiratory & cephalosporin antibiotics consignment.",
            items: {
              create: [
                { medicineName: "Cefixime 400mg (Caricef)", quantity: 60, unitPrice: 550.0, totalPrice: 33000.0 },
                { medicineName: "Cetirizine 10mg (Zyrtec)", quantity: 120, unitPrice: 210.0, totalPrice: 25200.0 },
              ],
            },
          },
        ],
      },
    },
  });

  const po3 = await prisma.purchaseOrder.findFirst({ where: { poNumber: "PO-2026-0003" } });
  if (po3) {
    await prisma.vendorPayment.create({
      data: {
        paymentNumber: "VP-2026-0002",
        vendorId: searle.id,
        purchaseOrderId: po3.id,
        amount: 40000.0,
        paymentMethod: "Raast",
        referenceNumber: "RAAST-88712365",
        notes: "Instant disbursement via Raast P2M settlement.",
        paidById: admin.id,
        paymentDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    });
  }

  const ferozsons = await prisma.vendor.create({
    data: {
      name: "Ferozsons Laboratories Distributor",
      contactPerson: "Usman Ghani (Key Accounts)",
      phone: "+92 42 3630 1199",
      email: "distribution@ferozsons-labs.com",
      address: "197-A, The Mall, Rawalpindi",
      balance: 0.0,
      purchaseOrders: {
        create: [
          {
            poNumber: "PO-2026-0004",
            totalAmount: 35000.0,
            paidAmount: 35000.0,
            status: PurchaseOrderStatus.DELIVERED,
            paymentStatus: PaymentStatus.PAID,
            notes: "Emergency IV drip infusions & clinical supply.",
            items: {
              create: [
                { medicineName: "Dextrose 5% Infusion (1000ml)", quantity: 100, unitPrice: 350.0, totalPrice: 35000.0 },
              ],
            },
          },
        ],
      },
    },
  });

  const po4 = await prisma.purchaseOrder.findFirst({ where: { poNumber: "PO-2026-0004" } });
  if (po4) {
    await prisma.vendorPayment.create({
      data: {
        paymentNumber: "VP-2026-0003",
        vendorId: ferozsons.id,
        purchaseOrderId: po4.id,
        amount: 35000.0,
        paymentMethod: "Cheque",
        referenceNumber: "HBL-CHQ-4928117",
        notes: "Paid in full via Habib Bank Limited cross cheque.",
        paidById: admin.id,
        paymentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // 9. Sample Shift Closing for Receptionist
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(17, 30, 0, 0);

  await prisma.shiftClosing.create({
    data: {
      userId: receptionist.id,
      shiftDate: yesterday,
      totalSystemCash: 4500.0,
      countedCash: 4500.0,
      variance: 0.0,
      notes: "Shift closed smoothly. All 9 cash invoices reconciled with drawer cash. Handed over to night supervisor.",
      status: ShiftStatus.CLOSED,
    },
  });

  // 10. Audit Logs
  const auditEntries = [
    {
      userId: admin.id,
      action: "SYSTEM_INITIALIZATION",
      details: "Ruqayya Clinic & Pharmacy management system initialized with RBAC boundaries.",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      userId: receptionist.id,
      action: "PATIENT_ENROLLED",
      details: "Registered patient Muhammad Ali Khan (PAT-2026-0001) with biometric fingerprint template.",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      userId: receptionist.id,
      action: "INVOICE_ISSUED",
      details: "Issued invoice INV-2026-0001 for OPD Consultation (Rs. 500).",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      userId: pharmacist.id,
      action: "PHARMACY_SALE",
      details: "Completed dispensary sale POS-2026-0001 with 5% generic discount applied (Rs. 627).",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      userId: pharmacist.id,
      action: "STOCK_REQUEST_SUBMITTED",
      details: "Submitted restock request for 100 units of Amoxicillin 500mg (Batch AMX-2026-RESTOCK).",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      userId: receptionist.id,
      action: "INVOICE_ISSUED",
      details: "Issued invoice INV-2026-0003 for Cardiology Specialist (Rs. 1,100).",
      createdAt: new Date(),
    },
  ];

  for (const entry of auditEntries) {
    await prisma.auditLog.create({ data: entry });
  }

  // 10. Seed 45 Hospital Medical Inventory Purchase Items
  await seedInventoryPurchases(prisma);

  // 11. Seed 289 Hospital & Pharmacy Medicines Matching Purchase Sheet
  await seed289MedicinesTs(prisma);

  // 12. Synchronize POS Billing & Dispensary Catalog (Medicines + Surgical Supplies)
  await syncPosCatalogFromInventory(prisma);

  console.log("Ruqayya Clinic database seeding completed successfully in Rupees (PKR)!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
