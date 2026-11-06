const { PrismaClient, ShiftStatus, PaymentStatus, PurchaseOrderStatus } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Vendors, Purchase Orders, Payments, and Shift Closings...");

  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  const receptionist = await prisma.user.findFirst({ where: { role: "RECEPTIONIST" } });

  if (!admin || !receptionist) {
    console.error("Required users (Admin or Receptionist) not found in database.");
    return;
  }

  // 1. Seed Pakistani Vendors / Distributors
  const vendorsData = [
    {
      name: "Getz Pharma Distribution Network",
      contactPerson: "Tariq Mehmood (Supply Chain Manager)",
      phone: "+92 21 3865 0001",
      email: "supply@getzpharma.pk",
      address: "Plot 29-30/27, Korangi Industrial Area, Karachi",
      balance: 65000.0,
    },
    {
      name: "Hilton Pharma Supply Division",
      contactPerson: "Kamran Baig (Accounts Officer)",
      phone: "+92 42 3578 4412",
      email: "orders@hiltonpharma.com.pk",
      address: "14-KM Multan Road, Lahore",
      balance: 42500.0,
    },
    {
      name: "The Searle Company Ltd. Logistics",
      contactPerson: "Zeeshan Siddiqui (Regional Distributor)",
      phone: "+92 51 4432 9988",
      email: "billing@searlecompany.com",
      address: "I-9 Industrial Area, Islamabad",
      balance: 18200.0,
    },
    {
      name: "Ferozsons Laboratories Distributor",
      contactPerson: "Usman Ghani (Key Accounts)",
      phone: "+92 42 3630 1199",
      email: "distribution@ferozsons-labs.com",
      address: "197-A, The Mall, Rawalpindi",
      balance: 0.0,
    },
  ];

  const createdVendors = [];
  for (const vData of vendorsData) {
    let vendor = await prisma.vendor.findFirst({ where: { name: vData.name } });
    if (!vendor) {
      vendor = await prisma.vendor.create({ data: vData });
      console.log(`Created Vendor: ${vendor.name}`);
    } else {
      console.log(`Vendor already exists: ${vendor.name}`);
    }
    createdVendors.push(vendor);
  }

  const [getz, hilton, searle, ferozsons] = createdVendors;

  // 2. Seed Purchase Orders & Payments
  // PO 1: Getz Pharma (Partial)
  let po1 = await prisma.purchaseOrder.findUnique({ where: { poNumber: "PO-2026-0001" } });
  if (!po1 && getz) {
    po1 = await prisma.purchaseOrder.create({
      data: {
        poNumber: "PO-2026-0001",
        vendorId: getz.id,
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
    });

    // Create payment against PO 1
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
    console.log("Created PO-2026-0001 and VP-2026-0001");
  }

  // PO 2: Hilton Pharma (Unpaid)
  let po2 = await prisma.purchaseOrder.findUnique({ where: { poNumber: "PO-2026-0002" } });
  if (!po2 && hilton) {
    po2 = await prisma.purchaseOrder.create({
      data: {
        poNumber: "PO-2026-0002",
        vendorId: hilton.id,
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
    });
    console.log("Created PO-2026-0002");
  }

  // PO 3: Searle Company (Partial)
  let po3 = await prisma.purchaseOrder.findUnique({ where: { poNumber: "PO-2026-0003" } });
  if (!po3 && searle) {
    po3 = await prisma.purchaseOrder.create({
      data: {
        poNumber: "PO-2026-0003",
        vendorId: searle.id,
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
    });

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
    console.log("Created PO-2026-0003 and VP-2026-0002");
  }

  // PO 4: Ferozsons (Fully Paid)
  let po4 = await prisma.purchaseOrder.findUnique({ where: { poNumber: "PO-2026-0004" } });
  if (!po4 && ferozsons) {
    po4 = await prisma.purchaseOrder.create({
      data: {
        poNumber: "PO-2026-0004",
        vendorId: ferozsons.id,
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
    });

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
    console.log("Created PO-2026-0004 and VP-2026-0003");
  }

  // 3. Seed Sample Historical Shift Closings for Receptionist
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(17, 30, 0, 0);

  const existingClosing = await prisma.shiftClosing.findFirst({
    where: { userId: receptionist.id },
  });

  if (!existingClosing) {
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
    console.log("Created sample historical ShiftClosing for Receptionist.");
  }

  console.log("Vendors, Purchase Orders, and Shift Closing seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error running vendor/shift seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

