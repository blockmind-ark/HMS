# Ruqayya Clinic: Hospital & Pharmacy Management System (HMS)

An integrated, role-based Hospital & Pharmacy Management System built for seamless healthcare operations, audit compliance, clinical invoicing, and dispensary POS.

---

## 🛠 Tech Stack

- **Framework:** Next.js 14+ (App Router, Server Actions & Route Handlers)
- **Language:** TypeScript 5+
- **Styling:** Tailwind CSS with dedicated `@media print` rules for 80mm ESC/POS thermal printers
- **Database & ORM:** PostgreSQL + Prisma ORM
- **Authentication & RBAC:** NextAuth.js (JWT strategy with strict role claims & edge middleware protection)
- **Icons & UI:** Lucide React
- **Currency:** Pakistani Rupees (PKR / Rs.)

---

## 👥 Default Demo User Accounts

| Role | Name | Email | Password | Access & Responsibilities |
| :--- | :--- | :--- | :--- | :--- |
| **ADMIN** | **Abu Bakar** | `admin@hms.local` | `admin123` | Full system access, Executive P&L Dashboard, Daily Cross-Portal Sales Reconciliation, Approvals Center, CSV Data Exports, Immutable Audit Trail |
| **DOCTOR** | **Dr. Tariq Khan** | `doctor@hms.local` | `doctor123` | Doctor Consultation Portal, Live Multi-Parameter Patient Search, Comprehensive Medical History Dossier, Clinical Diagnoses & Notes |
| **RECEPTIONIST** | **Adnan Ahmed** | `receptionist@hms.local` | `reception123` | Patient Registration, Biometric Enrollment & Verification, Clinical Visits (OPD/USG), Sequential Invoices (`INV-YYYY-XXXX`), ESC/POS Receipts |
| **PHARMACIST** | **Muhammad Tariq** | `pharmacist@hms.local` | `pharma123` | Pharmacy POS Billing, 5% Generic Medicine Discount, Patient UID Record Linking, Batch Inventory & Restock Requests |

*Note: The login screen at `/login` provides 1-click demo switcher buttons for instant authentication.*

---

## 🚀 Key Modules & Capabilities

### 1. Receptionist Desk (`/receptionist`)
- **Patient Registration & Sequential UID:** Generates collision-safe IDs (`PAT-2026-0001`, `PAT-2026-0002`).
- **Biometric Scanner Simulation:**
  - Optical laser scanning animation and minutiae acquisition simulation.
  - Generates cryptographic biometric hashes (`FP-HEX-FINGER`).
  - 1-Click Biometric Match: scans fingertip to load patient records instantly.
- **Clinical Procedures & Invoicing (PKR):**
  - Presets for OPD Consultations (Rs. 500), Abdominal/Pelvic Ultrasounds (Rs. 1,500), Specialist visits (Rs. 1,200).
  - Cashier calculator computing net fee, discounts, and exact change to return.
  - Sequential Invoice generation (`INV-YYYY-XXXX`).
- **ESC/POS Thermal Receipt Layout:**
  - Monospaced 80mm receipt modal formatted with dashed dividers, clinic headers, tax identifiers, itemized line items, and simulated barcode.
  - Native browser `window.print()` integration.
- **Patient Directory & Archive:** Searchable ledger displaying complete clinical visits, invoices, and linked pharmacy purchases.

### 2. Pharmacy POS & Inventory (`/pharmacist`)
- **Instant Formulary Search:** Real-time search across Brand and Generic names with category filters.
- **Auto-Applied 5% Generic Discount:** Automatically identifies generic medicines and deducts 5% from line totals, displaying savings badges.
- **Hospital Record Linking:** Optional Patient UID lookup to correlate dispensary purchases with hospital patient charts.
- **Atomic Stock Depletion:** POS checkout decrements batch stock quantity within a database transaction.
- **Stock Batch Restock Requests:** Pharmacists can submit restock requests with batch numbers, quantities, purchase/selling prices in PKR, and manufacturing/expiry dates. Requests route into the Admin Approvals Center in `PENDING` state.

### 3. Doctor Consultation Portal (`/doctor`)
- **Real-Time Patient Search:** Fast lookup by Patient Name, Patient UID (`PAT-2026-XXXX`), Phone Number, or Biometric Template Hash.
- **Comprehensive Patient Medical Dossier:**
  - Patient demographics (UID, Name, Age, Gender, Phone, Biometric Verification badge).
  - Financial & encounter summary badges (Consultations count, prescribed medicines count, total healthcare expenditure in PKR).
- **Tabbed Medical History Views:**
  - **Unified Medical Timeline:** Chronological unified visual timeline combining all clinical consultations and pharmacy POS checkouts.
  - **Clinical Consultations & Diagnoses:** Every doctor visit, OPD checkup, ultrasound scan, consultation fee, invoice status, and clinical notes.
  - **Clinical Findings & Diagnosis Recording:** Doctors can record or update diagnoses (e.g. Acute URTI, Essential Hypertension) and clinical instructions directly into the patient's permanent record.
  - **Dispensary & Medication History:** Complete pharmacy dispensing history detailing brand names, generic names, categories, quantities, and prices in `Rs.`.
  - **Invoices & Billing History:** Itemized procedure receipts, payment statuses, and discount records.
- **Printable Medical Dossier Layout:** Print-ready `@media print` layout with official Ruqayya Clinic header and doctor verification/stamp blocks.

### 4. Admin Executive Portal (`/admin`)
- **Daily Cross-Portal Sales Reconciliation:**
  - Date Picker with fast presets ("Today", "Yesterday", "2 Days Ago").
  - Comparative daily ledger checking collections across BOTH streams:
    - **Clinical Hospital Portal:** Invoices, visits (OPD, Ultrasound, Consultation), fees collected in Rs., discounts, and receptionist cashier audit.
    - **Pharmaceutical Dispensary Portal:** POS sales, medicines dispensed, 5% generic discounts, COGS, and pharmacy profit margin in Rs.
  - Visual revenue split bar showing percentage share (e.g., 65% Clinical vs 35% Pharmacy).
  - Print Daily Audit Sheet (`window.print()`) with official executive sign-off lines for Medical Incharge and Chief Pharmacist.
  - One-click daily CSV export (`Ruqayya_clinic_daily_sales_reconciliation_YYYY-MM-DD.csv`).
- **Financial & Operational Dashboard:**
  - Gross Revenue metrics split across Clinical Invoices and Pharmacy Sales in PKR.
  - Cost of Goods Sold (COGS) tracking and Pharmacy Net Profit calculation with percentage margin.
  - Top dispensed medicines ranked by volume and revenue.
- **Approvals Center:**
  - Pending batch requests submitted by pharmacists with projected profit margins.
  - One-click **Approve** (activates stock to `APPROVED` making it sellable) or **Reject** with mandatory audit comment.
- **Official Reports, Live Previews & CSV Data Exports:**
  - **Live Preview Summary Modal:** Preview live KPIs, summary figures in Pakistani Rupees (`Rs.`), and sample audited records for every respective report before downloading.
  - Interactive multi-tab switcher within the modal to cycle between all 6 reports seamlessly.
  - Date switcher for Daily Reconciliation reports.
  - **Live Summary Ribbon:** High-level overview cards displaying real-time counts and revenue totals for clinical encounters, invoices, POS sales, and inventory assets.
  - **One-Click CSV Downloads:**
    - Daily Cross-Portal Reconciliation Report (`Ruqayya_clinic_daily_sales_reconciliation_YYYY-MM-DD.csv`)
    - Visits Report (`Ruqayya_clinic_visits_YYYY-MM-DD.csv`)
    - Clinical Invoices Report (`Ruqayya_clinic_invoices_YYYY-MM-DD.csv`)
    - Pharmacy POS Sales Ledger (`Ruqayya_clinic_sales_YYYY-MM-DD.csv`)
    - Medicine Batches & Valuations (`Ruqayya_clinic_inventory_YYYY-MM-DD.csv`)
    - Security Audit Trail (`Ruqayya_clinic_audit_YYYY-MM-DD.csv`)
- **Immutable Audit Log Viewer:**
  - Comprehensive, tamper-evident security audit trail tracking staff logins, patient enrollments, invoices, POS transactions, and approval decisions.

---

## 💻 Getting Started Locally

1. **Clone the repository and install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables (`.env`):**
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hms?schema=public"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="hospital-management-system-super-secret-key-2026"
   ```

3. **Initialize the Database & Apply Schema:**
   ```bash
   npx prisma db push
   ```

4. **Seed Initial Clinicians, Formulary, Batches & Records:**
   ```bash
   npx prisma db seed
   ```

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to access the login terminal.

6. **Run the Automated Test Suite:**
   ```bash
   npx ts-node --compiler-options '{"module":"CommonJS"}' tests/verify-system.ts
   ```
