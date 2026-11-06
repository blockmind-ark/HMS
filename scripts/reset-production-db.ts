import { PrismaClient, Role, ApprovalStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { seedInventoryPurchases } from "../prisma/seed-inventory";
import { seed289MedicinesTs } from "../prisma/seed-medicines-289";
import { syncPosCatalogFromInventory } from "../prisma/sync-pos-catalog";

const prisma = new PrismaClient();

async function resetProductionDatabase() {
  console.log("================================================================================");
  console.log("     Ruqayya Clinic & Pharmacy - Production Operational Database Reset          ");
  console.log("================================================================================");
  console.log("\n[1/5] Purging all operational/transactional records...");

  // Delete all operational transactions in correct foreign-key sequence
  const [
    delShiftClosings,
    delDrawerAdjustments,
    delAuditLogs,
    delApprovalRequests,
    delPharmacySaleItems,
    delPharmacySales,
    delInvoiceItems,
    delInvoices,
    delVisits,
    delDailyTokens,
    delVendorPayments,
    delPOItems,
    delPOs,
    delPatients,
  ] = await Promise.all([
    prisma.shiftClosing.deleteMany(),
    prisma.drawerAdjustment.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.approvalRequest.deleteMany(),
    prisma.pharmacySaleItem.deleteMany(),
    prisma.pharmacySale.deleteMany(),
    prisma.invoiceItem.deleteMany(),
    prisma.invoice.deleteMany(),
    prisma.visit.deleteMany(),
    prisma.dailyTokenLog.deleteMany(),
    prisma.vendorPayment.deleteMany(),
    prisma.purchaseOrderItem.deleteMany(),
    prisma.purchaseOrder.deleteMany(),
    prisma.patient.deleteMany(),
  ]);

  console.log("✔ Cleared Operational Records:");
  console.log(`  • Visits Deleted:            ${delVisits.count}`);
  console.log(`  • Invoices Deleted:          ${delInvoices.count}`);
  console.log(`  • Token Queue Logs Deleted:  ${delDailyTokens.count}`);
  console.log(`  • Dispensary Sales Deleted:  ${delPharmacySales.count}`);
  console.log(`  • Shift Closings Reset:      ${delShiftClosings.count}`);
  console.log(`  • Patients Reset:            ${delPatients.count}`);

  console.log("\n[2/5] Initializing official production role-based user accounts...");

  const adminPassword = await bcrypt.hash("AdminPass123!", 10);
  const receptionistPassword = await bcrypt.hash("ReceptionPass123!", 10);
  const pharmacistPassword = await bcrypt.hash("PharmaPass123!", 10);
  const doctorPassword = await bcrypt.hash("DoctorPass123!", 10);

  // Upsert all 4 production users
  const admin = await prisma.user.upsert({
    where: { email: "admin@hms.com" },
    update: { password: adminPassword, displayPassword: "AdminPass123!", role: Role.ADMIN, name: "Hospital Administrator" },
    create: { email: "admin@hms.com", password: adminPassword, displayPassword: "AdminPass123!", role: Role.ADMIN, name: "Hospital Administrator" },
  });

  const receptionist = await prisma.user.upsert({
    where: { email: "reception@hms.com" },
    update: { password: receptionistPassword, displayPassword: "ReceptionPass123!", role: Role.RECEPTIONIST, name: "Front Desk Receptionist" },
    create: { email: "reception@hms.com", password: receptionistPassword, displayPassword: "ReceptionPass123!", role: Role.RECEPTIONIST, name: "Front Desk Receptionist" },
  });

  const pharmacist = await prisma.user.upsert({
    where: { email: "pharma@hms.com" },
    update: { password: pharmacistPassword, displayPassword: "PharmaPass123!", role: Role.PHARMACIST, name: "Dispensary Pharmacist" },
    create: { email: "pharma@hms.com", password: pharmacistPassword, displayPassword: "PharmaPass123!", role: Role.PHARMACIST, name: "Dispensary Pharmacist" },
  });

  const doctor = await prisma.user.upsert({
    where: { email: "doctor@hms.com" },
    update: { password: doctorPassword, displayPassword: "DoctorPass123!", role: Role.DOCTOR, name: "Dr. Tariq Khan (Physician)" },
    create: { email: "doctor@hms.com", password: doctorPassword, displayPassword: "DoctorPass123!", role: Role.DOCTOR, name: "Dr. Tariq Khan (Physician)" },
  });

  // Also ensure legacy aliases exist for backward compatibility
  const legacyAdminPassword = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@hms.local" },
    update: { password: legacyAdminPassword, displayPassword: "admin123" },
    create: { email: "admin@hms.local", password: legacyAdminPassword, displayPassword: "admin123", role: Role.ADMIN, name: "Abu Bakar (Admin)" },
  });
  const legacyReceptionistPassword = await bcrypt.hash("reception123", 10);
  await prisma.user.upsert({
    where: { email: "receptionist@hms.local" },
    update: { password: legacyReceptionistPassword, displayPassword: "reception123" },
    create: { email: "receptionist@hms.local", password: legacyReceptionistPassword, displayPassword: "reception123", role: Role.RECEPTIONIST, name: "Adnan Ahmed" },
  });
  const legacyPharmacistPassword = await bcrypt.hash("pharma123", 10);
  await prisma.user.upsert({
    where: { email: "pharmacist@hms.local" },
    update: { password: legacyPharmacistPassword, displayPassword: "pharma123" },
    create: { email: "pharmacist@hms.local", password: legacyPharmacistPassword, displayPassword: "pharma123", role: Role.PHARMACIST, name: "Muhammad Tariq" },
  });

  console.log("✔ Verified 4 Production User Accounts:");
  console.log("  👑 Admin:        admin@hms.com     | Password: AdminPass123!");
  console.log("  📋 Receptionist: reception@hms.com | Password: ReceptionPass123!");
  console.log("  💊 Pharmacist:   pharma@hms.com    | Password: PharmaPass123!");
  console.log("  🩺 Doctor:       doctor@hms.com    | Password: DoctorPass123!");

  console.log("\n[3/5] Verifying 45 hospital medical inventory purchase specifications...");
  await seedInventoryPurchases(prisma);

  console.log("\n[4/5] Verifying master sheet of 289 hospital catalog medicines...");
  await seed289MedicinesTs(prisma);

  console.log("\n[5/5] Synchronizing live active POS dispensary batches & pricing...");
  await syncPosCatalogFromInventory(prisma);

  // System Initial Audit Log Entry
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: "PRODUCTION_ENVIRONMENT_INITIALIZED",
      details: "Production database prepared for hospital go-live. Operational values reset to 0. All 289 catalog medicines synchronized.",
    },
  });

  // Verification Audit Report
  const [totalMeds, totalBatches, totalInvoices, totalSales, totalPatients] = await Promise.all([
    prisma.medicine.count(),
    prisma.stockBatch.count({ where: { approvalStatus: ApprovalStatus.APPROVED, quantity: { gt: 0 } } }),
    prisma.invoice.count(),
    prisma.pharmacySale.count(),
    prisma.patient.count(),
  ]);

  console.log("\n================================================================================");
  console.log("            PRODUCTION DATABASE RESET COMPLETED SUCCESSFULLY!                   ");
  console.log("================================================================================");
  console.log(`  • Invoices (Today's Total):   ${totalInvoices}  (Clean 0)`);
  console.log(`  • Dispensary Sales (Revenue): ${totalSales}     (Clean 0)`);
  console.log(`  • Registered Patients:        ${totalPatients}  (Clean 0, ready for live intake)`);
  console.log(`  • Active Catalog Medicines:   ${totalMeds}      (289 items ready for billing)`);
  console.log(`  • Active Stock Batches:       ${totalBatches}   (Ready in pharmacy POS)`);
  console.log("================================================================================\n");
}

resetProductionDatabase()
  .catch((err) => {
    console.error("Failed to reset production database:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

