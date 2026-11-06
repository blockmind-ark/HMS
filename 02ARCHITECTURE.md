# System Architecture & Database Schema

## 1. Tech Stack
- Frontend: Next.js (App Router), Tailwind CSS, TypeScript, Lucide Icons.
- Backend: Next.js API Routes / Server Actions.
- ORM & DB: Prisma ORM with PostgreSQL.
- Auth: NextAuth.js (Credentials Provider with role claims).

## 2. Prisma Database Schema (`prisma/schema.prisma`)
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  ADMIN
  RECEPTIONIST
  PHARMACIST
}

enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
}

model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String
  role      Role     @default(RECEPTIONIST)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  auditLogs       AuditLog[]
  approvalRequests ApprovalRequest[]
  invoices        Invoice[]
  sales           PharmacySale[]
}

model Patient {
  id              String   @id @default(cuid())
  patientUid      String   @unique
  name            String
  phone           String
  age             Int
  gender          String
  biometricHash   String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  visits          Visit[]
  invoices        Invoice[]
  pharmacySales   PharmacySale[]
}

model Visit {
  id          String   @id @default(cuid())
  patientId   String
  patient     Patient  @relation(fields: [patientId], references: [id])
  serviceType String   // e.g. "OPD", "Ultrasound", "Consultation"
  fee         Float
  createdAt   DateTime @default(now())
  
  invoice     Invoice?
}

model Invoice {
  id            String   @id @default(cuid())
  invoiceNumber String   @unique
  patientId     String
  patient       Patient  @relation(fields: [patientId], references: [id])
  visitId       String?  @unique
  visit         Visit?   @relation(fields: [visitId], references: [id])
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  totalAmount   Float
  discount      Float    @default(0)
  status        String   @default("PAID") // PAID, CANCELLED
  createdAt     DateTime @default(now())

  items         InvoiceItem[]
}

model InvoiceItem {
  id        String   @id @default(cuid())
  invoiceId String
  invoice   Invoice  @relation(fields: [invoiceId], references: [id])
  description String
  quantity  Int
  price     Float
}

model Medicine {
  id          String   @id @default(cuid())
  name        String
  genericName String
  category    String
  threshold   Int      @default(10)
  createdAt   DateTime @default(now())

  batches     StockBatch[]
  saleItems   PharmacySaleItem[]
}

model StockBatch {
  id            String         @id @default(cuid())
  medicineId    String
  medicine      Medicine       @relation(fields: [medicineId], references: [id])
  batchNumber   String
  quantity      Int
  purchasePrice Float
  sellingPrice  Float
  mfgDate       DateTime
  expiryDate    DateTime
  approvalStatus ApprovalStatus @default(PENDING)
  createdAt     DateTime       @default(now())
}

model PharmacySale {
  id          String   @id @default(cuid())
  saleNumber  String   @unique
  patientId   String?
  patient     Patient? @relation(fields: [patientId], references: [id])
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  totalAmount Float
  discount    Float    @default(0)
  createdAt   DateTime @default(now())

  items       PharmacySaleItem[]
}

model PharmacySaleItem {
  id             String       @id @default(cuid())
  saleId         String
  sale           PharmacySale @relation(fields: [saleId], references: [id])
  medicineId     String
  medicine       Medicine     @relation(fields: [medicineId], references: [id])
  quantity       Int
  unitPrice      Float
  totalPrice     Float
}

model ApprovalRequest {
  id          String         @id @default(cuid())
  type        String         // "INVENTORY_ADD", "PURCHASE_ORDER", "THRESHOLD_CHANGE"
  details     String         // JSON stringified details
  requestedById String
  requestedBy User           @relation(fields: [requestedById], references: [id])
  status      ApprovalStatus @default(PENDING)
  comment     String?
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
}

model AuditLog {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  action    String
  details   String
  createdAt DateTime @default(now())
}