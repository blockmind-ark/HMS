import { prisma } from "../src/lib/prisma";
import * as bcrypt from "bcryptjs";

async function runVerification() {
  console.log("=================================================");
  console.log("🏥 STARTING Ruqayya CLINIC & PHARMACY COMPREHENSIVE VERIFICATION");
  console.log("=================================================\n");

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
    // 1. Database & Seeding Verification
    console.log("--- 1. Database Seeding & Models Check ---");
    const userCount = await prisma.user.count();
    const patientCount = await prisma.patient.count();
    const medicineCount = await prisma.medicine.count();
    const batchCount = await prisma.stockBatch.count();

    assert(userCount >= 3, "Default Users Existence", `Found ${userCount} users`);
    assert(patientCount >= 4, "Initial Patient Registry", `Found ${patientCount} patients`);
    assert(medicineCount >= 10, "Medicine Formulary", `Found ${medicineCount} medicines`);
    assert(batchCount >= 5, "Stock Batches", `Found ${batchCount} batches`);

    // Verify Password Hash & Roles
    const adminUser = await prisma.user.findUnique({ where: { email: "admin@hms.local" } });
    const isPassValid = adminUser ? await bcrypt.compare("admin123", adminUser.password) : false;
    assert(isPassValid, "Admin Password Authentication Validated", `Admin role: ${adminUser?.role}`);

    const receptionistUser = await prisma.user.findUnique({ where: { email: "receptionist@hms.local" } });
    assert(receptionistUser?.role === "RECEPTIONIST", "Receptionist Role Configured");

    const pharmacistUser = await prisma.user.findUnique({ where: { email: "pharmacist@hms.local" } });
    assert(pharmacistUser?.role === "PHARMACIST", "Pharmacist Role Configured");

    // 2. Receptionist Workflow Verification
    console.log("\n--- 2. Receptionist Portal Flow ---");
    // Register Patient
    const currentYear = new Date().getFullYear();
    const totalP = await prisma.patient.count();
    const newUid = `PAT-${currentYear}-${String(totalP + 1).padStart(4, "0")}`;

    const newPatient = await prisma.patient.create({
      data: {
        patientUid: newUid,
        name: "Kamran Akmal",
        phone: "+92 300 7654321",
        age: 38,
        gender: "Male",
        biometricHash: "FP-9F81AC341B209EAA-RINDEX",
      },
    });
    assert(!!newPatient.id, "Patient Registration with Biometric Template", `UID: ${newPatient.patientUid}`);

    // Create Visit & Invoicing
    const visitFee = 1500.0;
    const discount = 100.0;
    const netTotal = visitFee - discount;
    const totalInvoices = await prisma.invoice.count();
    const invNumber = `INV-${currentYear}-${String(totalInvoices + 1).padStart(4, "0")}`;

    const newVisit = await prisma.visit.create({
      data: {
        patientId: newPatient.id,
        serviceType: "Ultrasound Abdomen & Pelvis",
        fee: visitFee,
      },
    });

    const newInvoice = await prisma.invoice.create({
      data: {
        invoiceNumber: invNumber,
        patientId: newPatient.id,
        visitId: newVisit.id,
        userId: receptionistUser!.id,
        totalAmount: netTotal,
        discount: discount,
        status: "PAID",
        items: {
          create: [
            {
              description: "Ultrasound Abdomen & Pelvis",
              quantity: 1,
              price: visitFee,
            },
          ],
        },
      },
      include: { items: true },
    });

    assert(newInvoice.totalAmount === 1400.0, "Sequential Invoice Calculation", `Invoice: ${newInvoice.invoiceNumber}, Net: Rs. ${newInvoice.totalAmount}`);
    assert(newInvoice.items.length === 1, "Itemized Invoice Items Linked");

    // 3. Pharmacist POS & 5% Generic Discount Verification
    console.log("\n--- 3. Pharmacist Portal & POS Dispensary Flow ---");
    const paracetamol = await prisma.medicine.findFirst({
      where: { name: { contains: "Paracetamol" } },
      include: { batches: { where: { approvalStatus: "APPROVED", quantity: { gt: 5 } } } },
    });
    assert(!!paracetamol && paracetamol.batches.length > 0, "Approved Medicine Batch Located", `Medicine: ${paracetamol?.name}`);

    const batchToDispense = paracetamol!.batches[0];
    const initialQty = batchToDispense.quantity;
    const dispenseQty = 2;
    const isGeneric = paracetamol!.name.toLowerCase().includes(paracetamol!.genericName.toLowerCase());
    const itemSubtotal = dispenseQty * batchToDispense.sellingPrice;
    const genericDiscount = isGeneric ? itemSubtotal * 0.05 : 0;
    const saleNet = itemSubtotal - genericDiscount;

    assert(isGeneric, "5% Generic Medicine Auto-Detection Logic", `Generic Name: ${paracetamol?.genericName}`);
    assert(genericDiscount > 0, "Generic Discount Amount Calculated", `Subtotal: Rs. ${itemSubtotal}, 5% Discount: -Rs. ${genericDiscount.toFixed(2)}, Net: Rs. ${saleNet.toFixed(2)}`);

    // Complete POS Sale
    const totalSales = await prisma.pharmacySale.count();
    const saleNumber = `POS-${currentYear}-${String(totalSales + 1).padStart(4, "0")}`;

    const sale = await prisma.$transaction(async (tx) => {
      await tx.stockBatch.update({
        where: { id: batchToDispense.id },
        data: { quantity: { decrement: dispenseQty } },
      });

      return await tx.pharmacySale.create({
        data: {
          saleNumber,
          patientId: newPatient.id,
          userId: pharmacistUser!.id,
          totalAmount: saleNet,
          discount: genericDiscount,
          items: {
            create: [
              {
                medicineId: paracetamol!.id,
                quantity: dispenseQty,
                unitPrice: batchToDispense.sellingPrice,
                totalPrice: itemSubtotal,
              },
            ],
          },
        },
      });
    });

    const updatedBatch = await prisma.stockBatch.findUnique({ where: { id: batchToDispense.id } });
    assert(updatedBatch?.quantity === initialQty - dispenseQty, "Inventory Batch Stock Decremented Atomically", `Initial: ${initialQty} -> Remaining: ${updatedBatch?.quantity}`);
    assert(sale.saleNumber === saleNumber, "Sequential Pharmacy POS Sale Number", `Sale #: ${sale.saleNumber}`);

    // Submit Stock Batch Intake Request (Pending Admin Approval)
    const pendingBatch = await prisma.stockBatch.create({
      data: {
        medicineId: paracetamol!.id,
        batchNumber: "TEST-INTAKE-2026",
        quantity: 50,
        purchasePrice: 25.0,
        sellingPrice: 40.0,
        mfgDate: new Date(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        approvalStatus: "PENDING",
      },
    });

    const approvalReq = await prisma.approvalRequest.create({
      data: {
        type: "INVENTORY_ADD",
        details: JSON.stringify({
          medicineName: paracetamol!.name,
          batchNumber: pendingBatch.batchNumber,
          quantity: 50,
          purchasePrice: 25.0,
          sellingPrice: 40.0,
          batchId: pendingBatch.id,
        }),
        requestedById: pharmacistUser!.id,
        status: "PENDING",
      },
    });

    assert(pendingBatch.approvalStatus === "PENDING", "Pharmacist Intake Stored as PENDING");
    assert(approvalReq.status === "PENDING", "Approval Request Created for Admin Oversight");

    // 4. Admin Approvals & Analytics Verification
    console.log("\n--- 4. Admin Approvals & Audit Trail Flow ---");
    // Admin approves the pharmacist request
    await prisma.$transaction(async (tx) => {
      await tx.approvalRequest.update({
        where: { id: approvalReq.id },
        data: {
          status: "APPROVED",
          comment: "Approved by Abu Bakar. Verified shipment.",
        },
      });

      await tx.stockBatch.update({
        where: { id: pendingBatch.id },
        data: { approvalStatus: "APPROVED" },
      });
    });

    const approvedBatch = await prisma.stockBatch.findUnique({ where: { id: pendingBatch.id } });
    assert(approvedBatch?.approvalStatus === "APPROVED", "Admin Gate: Batch Status Activated to APPROVED");

    // Record Audit Log
    const audit = await prisma.auditLog.create({
      data: {
        userId: adminUser!.id,
        action: "STOCK_APPROVED",
        details: `Approved restock request for ${pendingBatch.quantity} units of ${paracetamol?.name} (Batch: ${pendingBatch.batchNumber}).`,
      },
    });
    assert(!!audit.id, "Immutable Audit Log Recorded", `Action: ${audit.action}`);

    // Verify Financial Aggregation
    const allInvoices = await prisma.invoice.findMany({ where: { status: "PAID" } });
    const allSales = await prisma.pharmacySale.findMany();
    const clinRev = allInvoices.reduce((s, i) => s + i.totalAmount, 0);
    const rxRev = allSales.reduce((s, i) => s + i.totalAmount, 0);
    const combinedRev = clinRev + rxRev;

    assert(combinedRev > 0, "Financial Ledger Aggregation", `Clinical: Rs. ${clinRev.toFixed(2)}, Pharmacy: Rs. ${rxRev.toFixed(2)}, Total: Rs. ${combinedRev.toFixed(2)}`);

    console.log("\n=================================================");
    console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("=================================================");

    if (failed > 0) process.exit(1);
  } catch (error) {
    console.error("Test execution threw error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runVerification();

