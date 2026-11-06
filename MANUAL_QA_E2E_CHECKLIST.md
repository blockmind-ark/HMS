# Hospital & Pharmacy Management System (HMS)
## End-to-End (E2E) Manual QA Testing Suite & Human Scenario Checklist

> **Target Application:** Ruqayya Hospital & Pharmacy Management System  
> **Deployment Model:** On-Premise Local Server (Ubuntu / Windows Docker Container)  
> **Audience:** QA Engineers, Clinical User Acceptance Testers (UAT), Hospital Operations Staff  
> **Version:** 1.0.0 Production Release  

---

## 1. Test Environment & User Roles

### Server Configuration
- **Local Server URL:** `http://localhost:3000`
- **Hospital Intranet URL:** `http://<SERVER_STATIC_LAN_IP>:3000` (e.g. `http://192.168.1.100:3000`)
- **Database:** PostgreSQL 15/16 with seeded catalog & 4 default roles

### Default Staff Accounts for Testing

| Role | Test Email | Default Password | Primary Portal | Access Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin@hms.local` | `password123` *(or `admin123` in seed)* | `/admin` | Complete system governance, audit logs, inventory approvals, daily ledger, user management |
| **Receptionist** | `receptionist@hms.local` | `password123` *(or `reception123`)* | `/receptionist` | Patient registration, visit tickets, consultation fees, thermal receipt printing, patient directory |
| **Doctor** | `doctor@hms.local` | `password123` *(or `doctor123`)* | `/doctor` | Patient queue, clinical history, diagnosis & consultation notes recording |
| **Pharmacist** | `pharmacist@hms.local` | `password123` *(or `pharma123`)* | `/pharmacist` | Dispensary POS, 5% generic discount, stock batches, purchase requests |

---

## 2. Test Execution Tracking Matrix

| Module | Test Case ID Range | Total Scenarios | Status | Tester Name | Date |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **1. Auth & Role-Based Access** | `TC-AUTH-001` to `TC-AUTH-008` | 8 | [ ] Pending | | |
| **2. Reception & Patient Intake** | `TC-REC-001` to `TC-REC-012` | 12 | [ ] Pending | | |
| **3. Doctor Consultation & Notes**| `TC-DOC-001` to `TC-DOC-007` | 7 | [ ] Pending | | |
| **4. Pharmacy POS & Stock** | `TC-PHARM-001` to `TC-PHARM-012` | 12 | [ ] Pending | | |
| **5. Admin Governance & Ledger**| `TC-ADM-001` to `TC-ADM-010` | 10 | [ ] Pending | | |
| **6. Full Hospital E2E Journey** | `TC-E2E-001` to `TC-E2E-004` | 4 | [ ] Pending | | |
| **7. Real-World Edge & Error Cases**| `TC-EDGE-001` to `TC-EDGE-009` | 9 | [ ] Pending | | |
| **8. Hardware & Thermal Printing** | `TC-PRINT-001` to `TC-PRINT-005` | 5 | [ ] Pending | | |

---

## Module 1: Authentication, Roles & Session Integrity (Human Scenarios)

### TC-AUTH-001: Standard Email & Password Authentication
- **Precondition:** User is logged out and navigating to `http://localhost:3000/login`.
- **Steps:**
  1. Enter valid email `receptionist@hms.local` and password `password123`.
  2. Click **"Sign In to Portal"**.
- **Expected Result:**
  - Status indicator displays login in progress.
  - Successfully redirected to `/receptionist`.
  - Top navigation displays logged-in user name "Adnan Ahmed (Receptionist)" and role badge.

### TC-AUTH-002: Invalid Password Error Handling
- **Steps:**
  1. Enter `admin@hms.local` with incorrect password `wrongpassword999`.
  2. Click **"Sign In to Portal"**.
- **Expected Result:**
  - Red warning banner appears: *"Invalid email or password"*.
  - User remains on `/login` without page crash or session generation.

### TC-AUTH-003: Quick 1-Click Role Switchers
- **Steps:**
  1. From `/login`, click the **"Doctor"** quick demo card (`Dr. Tariq Khan`).
- **Expected Result:**
  - Form automatically fills credentials and logs in.
  - Redirects directly to `/doctor`.

### TC-AUTH-004: Role-Based Access Control (RBAC) Route Protection
- **Steps:**
  1. Log in as `receptionist@hms.local`.
  2. In the browser URL address bar, manually type `http://localhost:3000/admin`.
  3. Press Enter.
- **Expected Result:**
  - Middleware blocks access.
  - User is redirected back to `/receptionist` or `/login` with an unauthorized warning.
  - Admin governance screens are never exposed to receptionists.

### TC-AUTH-005: Cross-Role Route Tampering (Pharmacist trying to access Doctor Notes)
- **Steps:**
  1. Log in as `pharmacist@hms.local`.
  2. Manually enter URL `http://localhost:3000/doctor`.
- **Expected Result:**
  - System denies access and redirects safely without revealing clinical files.

### TC-AUTH-006: Secure Session Sign Out
- **Steps:**
  1. In the top navigation bar, click the **Profile Menu** -> **"Sign Out"**.
  2. Attempt to press the browser **Back** button.
- **Expected Result:**
  - Session cookie is invalidated.
  - User lands on `/login`.
  - Pressing browser back button does not permit cached privileged actions.

### TC-AUTH-007: Automatic Session Expiry / CSRF Protection
- **Steps:**
  1. Clear browser cookies manually in DevTools or wait for token expiry.
  2. Trigger any POST request (e.g. register patient or checkout sale).
- **Expected Result:**
  - API returns `401 Unauthorized`.
  - User is prompted to re-authenticate cleanly.

### TC-AUTH-008: Non-Existent Route Handling
- **Steps:**
  1. Navigate to `http://localhost:3000/some-random-page`.
- **Expected Result:**
  - Clean branded 404 page appears with button to return to authorized dashboard.

---

## Module 2: Clinical Reception Desk & Patient Intake

### TC-REC-001: Registering a New First-Time Patient
- **Precondition:** Logged in as `receptionist@hms.local` on `/receptionist`.
- **Steps:**
  1. Click **"+ Register New Patient"** button.
  2. Fill in the modal:
     - Full Name: `Muhammad Usman Khan`
     - Phone: `0300-1234567`
     - Age: `34`
     - Gender: `Male`
  3. Click **"Save Patient Record"**.
- **Expected Result:**
  - Confirmation modal appears: *"Patient Successfully Enrolled"*.
  - A unique formatted Patient UID is generated: `PAT-YYYY-XXXX` (e.g. `PAT-2026-0001`).
  - Total registered patient counter increments by 1.
  - Patient is immediately selected in the intake dossier.

### TC-REC-002: Searching Existing Patient by Name & Phone
- **Steps:**
  1. On the Receptionist dashboard, enter `Usman` in the Patient Search box.
  2. Verify dropdown or table displays matching record.
  3. Clear and enter phone number `0300-1234567`.
- **Expected Result:**
  - Instant search returns Muhammad Usman Khan.
  - Clicking the patient loads their full profile, previous visits, and balance history.

### TC-REC-003: Visit Ticket Creation (General OPD)
- **Steps:**
  1. Select patient `Muhammad Usman Khan`.
  2. Under Service Selection, choose preset: **"General OPD Consultation (Rs. 500)"**.
  3. Leave discount as `0`.
  4. Tender cash: Enter `500`.
  5. Click **"Issue Invoice & Print Receipt"**.
- **Expected Result:**
  - A sequential invoice number is assigned (e.g. `INV-2026-0001`).
  - Visit record is created under the patient's ID.
  - ESC/POS thermal receipt modal pops up with exact Rs. 500 charge.
  - "Today's Clinical Revenue" increases by Rs. 500.

### TC-REC-004: Custom Service Fee & Ultrasound Booking
- **Steps:**
  1. Select a patient.
  2. Choose preset: **"Ultrasound Abdomen & Pelvis (Rs. 1500)"**.
  3. Override the default fee to `Rs. 1800` (e.g. emergency urgent ultrasound).
  4. Tender cash: `2000`.
- **Expected Result:**
  - Tender calculator displays:
    - Total Due: `Rs. 1,800`
    - Cash Tendered: `Rs. 2,000`
    - **Change Return: `Rs. 200`**
  - Invoice and thermal receipt show Rs. 1,800 total.

### TC-REC-005: Discount Approval Handling (Welfare / Zakat / Courtesy)
- **Steps:**
  1. Select a patient requiring financial assistance.
  2. Service: Specialist Consultation (`Rs. 1200`).
  3. Enter Discount: `Rs. 300`.
- **Expected Result:**
  - Net payable dynamically recalculates to `Rs. 900`.
  - Thermal receipt clearly displays: Subtotal: `Rs. 1200`, Discount: `Rs. 300`, Net Paid: `Rs. 900`.
  - Cash ledger registers Rs. 900 collected.

### TC-REC-006: Patient Proceed Success Modal & Auto Form Reset
- **Steps:**
  1. Complete an invoice checkout for a patient.
  2. Notice the "Patient Proceeded Successfully" modal.
  3. Click **"Next Patient"** or dismiss.
- **Expected Result:**
  - Search box is cleared.
  - Selected patient is unmounted.
  - Fee inputs reset to default preset (`Rs. 500`).
  - Terminal is fresh and ready for the next patient in line without manual clearing.

### TC-REC-007: Patient Directory Tab Inspection
- **Steps:**
  1. Switch to the **"Patient Directory"** tab.
  2. Review the roster table.
- **Expected Result:**
  - Lists all registered patients with UID, Name, Age, Gender, Contact, and Total Visits.
  - Clicking on any patient opens their lifelong consultation and billing history.

### TC-REC-008: Thermal Receipt Reprinting from History
- **Steps:**
  1. In the Patient Directory, open a patient who has a past invoice.
  2. Locate the invoice in their history.
  3. Click the **"Reprint Receipt"** printer icon.
- **Expected Result:**
  - 80mm ESC/POS thermal receipt modal renders with the original invoice number, timestamp, and details.

### TC-REC-009: Receptionist Daily Accountability Tab
- **Steps:**
  1. Switch to the **"Daily Accountability"** tab on `/receptionist`.
- **Expected Result:**
  - Displays today's date summary:
    - Total Invoices Generated
    - Gross Revenue Collected
    - Service breakdown (OPD vs Ultrasound vs Specialist)
  - Matches the total sum of cash in the receptionist's physical drawer.

### TC-REC-010: Validation of Required Patient Intake Fields
- **Steps:**
  1. Click **"+ Register New Patient"**.
  2. Leave Name blank, enter Age `-5`, and click Save.
- **Expected Result:**
  - HTML5 / React validation halts submission.
  - Field indicates Name is required and Age must be a positive integer.

### TC-REC-011: Phone Number Search Variations
- **Steps:**
  1. Search patient using partial digits (e.g. `1234` from `0300-1234567`).
- **Expected Result:**
  - Fuzzy matching surfaces the patient record immediately.

### TC-REC-012: Zero-Cost Consultation (Follow-Up Visit)
- **Steps:**
  1. Register a 3-day follow-up visit for an existing patient.
  2. Set Custom Fee to `Rs. 0` with remark "Doctor Follow-up".
  3. Submit invoice.
- **Expected Result:**
  - Invoice issues successfully with Rs. 0 charge.
  - Visit is logged in doctor's queue.

---

## Module 3: Doctor Consultation & Clinical Notes

### TC-DOC-001: Patient Consultation Queue Visibility
- **Precondition:** Logged in as `doctor@hms.local` on `/doctor`.
- **Steps:**
  1. View the left-hand Patient Directory list.
- **Expected Result:**
  - All registered hospital patients are visible.
  - Shows Patient UID, Full Name, Gender, and Age.
  - Patients with active visits today appear at the top.

### TC-DOC-002: Reviewing Patient Lifelong Dossier
- **Steps:**
  1. Click on `Muhammad Usman Khan` in the queue.
  2. Switch between tabs:
     - **Timeline:** Chronological clinical events.
     - **Visits:** Historical OPD and Ultrasound consultations.
     - **Medications:** Past dispensed pharmacy drugs.
     - **Invoices:** Billing receipts and fee history.
- **Expected Result:**
  - Dossier accurately loads data from PostgreSQL.
  - Shows the Rs. 500 OPD visit created at Reception.
  - Displays any medicines previously purchased at the pharmacy.

### TC-DOC-003: Recording Clinical Diagnosis & Prescription Notes
- **Steps:**
  1. Under the active visit, click **"Add / Edit Clinical Note"**.
  2. Enter Diagnosis: `Acute Viral Pharyngitis with Low-grade Pyrexia`.
  3. Enter Clinical Advice: `1. Tab Paracetamol 500mg TDS x 3 days. 2. Warm saline gargles. 3. Review in 3 days if fever persists.`
  4. Click **"Save Clinical Record"**.
- **Expected Result:**
  - Success banner appears: *"Clinical notes updated successfully"*.
  - Notes persist immediately and are visible under the visit timeline.
  - Refreshing the browser preserves the saved diagnosis.

### TC-DOC-004: Preventing Accidental Overwrites
- **Steps:**
  1. Open a completed visit with existing notes.
  2. Click Cancel while editing.
- **Expected Result:**
  - Previous notes are restored without data loss.

### TC-DOC-005: Doctor Cannot Alter Billing Invoices
- **Steps:**
  1. Inspect the Invoices tab in Doctor portal.
- **Expected Result:**
  - Invoices are visible in read-only format for medical context.
  - Doctor has no option to delete or modify invoice amounts.

### TC-DOC-006: Patient Search in Doctor Consultation Room
- **Steps:**
  1. Type `0300` in the Doctor search bar.
- **Expected Result:**
  - Instant filtering narrows the roster to matching patients.

### TC-DOC-007: Clinical Audit Log Verification
- **Steps:**
  1. After saving notes, check Admin audit logs as Admin.
- **Expected Result:**
  - Audit log records: `User Dr. Tariq Khan updated clinical record for Patient PAT-XXXX-XXXX`.

---

## Module 4: Pharmacy POS, Dispensary & Stock Control

### TC-PHARM-001: Searching Medicines by Brand & Generic Name
- **Precondition:** Logged in as `pharmacist@hms.local` on `/pharmacist`.
- **Steps:**
  1. In the POS medicine catalog, search `Panadol`.
  2. Clear and search `Paracetamol`.
- **Expected Result:**
  - Both searches display Paracetamol / Panadol tablets with formulation and available stock.
  - Current unit price and active batch number are visible.

### TC-PHARM-002: Auto-Applied 5% Generic Medicine Discount
- **Steps:**
  1. In the medicine catalog, find a medicine marked as **Generic Formulation** (e.g. *Paracetamol 500mg Generic*).
  2. Click **"+"** to add 2 strips to the cart.
- **Expected Result:**
  - Cart shows a distinctive green badge: **"5% Generic Discount Applied"**.
  - Subtotal reflects: `(2 * Unit Price) - 5% discount`.
  - Savings amount is clearly displayed in PKR.

### TC-PHARM-003: Brand vs. Generic Cart Mixing
- **Steps:**
  1. Add 1 Brand-name medicine (0% discount, e.g. *Augmentin 625mg*).
  2. Add 1 Generic medicine (5% discount, e.g. *Amoxicillin+Clavulanic Acid Generic*).
- **Expected Result:**
  - Cart accurately calculates discount **only** on the generic item.
  - Total Net Payable correctly combines the discounted generic item + full-price brand item.

### TC-PHARM-004: Linking Pharmacy Sale to Hospital Patient UID
- **Steps:**
  1. In the POS header, enter Patient UID: `PAT-2026-0001` (or click search).
  2. Click **"Lookup Patient"**.
- **Expected Result:**
  - Displays linked patient badge: `Muhammad Usman Khan (Age: 34, Male)`.
  - The pharmacy sale will be permanently archived in the patient's hospital dossier.

### TC-PHARM-005: Walk-In / Anonymous Customer Sale (OTC)
- **Steps:**
  1. Add medicines to cart.
  2. Leave the Patient UID field blank.
  3. Proceed to checkout.
- **Expected Result:**
  - Sale completes successfully as **"Walk-in OTC Customer"**.
  - Generates sale sequence (e.g. `SALE-2026-0001`).
  - Cash ledger records revenue without requiring patient registration.

### TC-PHARM-006: Stock Depletion & Inventory Deduction
- **Steps:**
  1. Note the current stock of *Amoxicillin Batch B-2026-01* (e.g. 50 units).
  2. Sell 5 units via POS checkout.
  3. Return to the Catalog or Inventory tab.
- **Expected Result:**
  - Stock count immediately decreases from `50` to `45`.
  - Multiple concurrent sales cannot exceed available batch quantity.

### TC-PHARM-007: Preventing Sale of Out-of-Stock Items
- **Steps:**
  1. Attempt to add a medicine with `0` stock to the cart.
  2. Alternatively, in the cart, attempt to increase quantity past `maxStock`.
- **Expected Result:**
  - Quantity increment button disabled at max stock.
  - Alert prevents adding zero-inventory items.

### TC-PHARM-008: Batch Expiry Date Validation
- **Steps:**
  1. Inspect the Inventory tab for batch expiry dates.
  2. Check expired batches.
- **Expected Result:**
  - Expired batches display an amber/red warning badge.
  - POS algorithm selects only non-expired, active approved batches (FEFO: First Expired, First Out).

### TC-PHARM-009: Thermal Dispensary Receipt Generation
- **Steps:**
  1. Complete a pharmacy checkout.
- **Expected Result:**
  - Dispensary thermal receipt displays:
    - Hospital Name & Pharmacy Counter header
    - Sale Number, Date, Cashier Name
    - Patient UID & Name (if linked)
    - Itemized medicine name, batch number, qty, unit price
    - Generic discount breakdown
    - Net Total Paid in PKR
  - Triggering `window.print()` outputs 80mm format cleanly.

### TC-PHARM-010: Pharmacist Stock Purchase Request Submission
- **Steps:**
  1. Go to **"Inventory & Batches"** tab on `/pharmacist`.
  2. Click **"Request Stock / Purchase Order"**.
  3. Select Medicine: *Ciprofloxacin 500mg*.
  4. Enter Batch Number: `CP-9901`, Quantity: `100`, Purchase Price: `Rs. 15`, Selling Price: `Rs. 25`, Expiry Date: `2027-12-31`.
  5. Click **"Submit Request to Admin"**.
- **Expected Result:**
  - Request state is set to `PENDING`.
  - Medicine stock does NOT increase until Admin formally approves it.
  - Pharmacist sees the request under "Pending Approvals".

### TC-PHARM-011: Daily Summary & Pharmacy Cash Drawer View
- **Steps:**
  1. Go to **"Daily Accountability"** tab on `/pharmacist`.
- **Expected Result:**
  - Displays:
    - Today's Pharmacy Gross Revenue
    - Total Units Sold
    - Total Sales Count
    - Generic Discount Given Today

### TC-PHARM-012: Cart Item Removal and Clearing
- **Steps:**
  1. Add 3 different medicines to the cart.
  2. Remove 1 item using the Trash icon.
  3. Click **"Clear Cart"**.
- **Expected Result:**
  - Individual item is cleanly removed and totals update.
  - Clear Cart empties the state completely.

---

## Module 5: Admin Governance, Approvals & Financial Ledger

### TC-ADM-001: Executive KPI Dashboard & Real-Time Metrics
- **Precondition:** Logged in as `admin@hms.local` on `/admin`.
- **Steps:**
  1. View the main Dashboard tab.
- **Expected Result:**
  - KPI cards display:
    - **Total Combined Revenue:** Sum of Clinical Reception Invoices + Pharmacy Sales.
    - **Clinical Visits Today:** Total OPD & Ultrasound tickets.
    - **Pharmacy Units Sold:** Total prescription & OTC units.
    - **Pending Approvals Count:** Badge showing pending stock requests.

### TC-ADM-002: Approving Pharmacist Stock Requests
- **Steps:**
  1. Go to the **"Approvals Center"** tab.
  2. Locate the pending request submitted by the pharmacist (`CP-9901`, 100 units).
  3. Enter Comment: *"Approved after invoice verification with vendor"*.
  4. Click **"Approve & Activate Stock"**.
- **Expected Result:**
  - Status updates to `APPROVED`.
  - Stock batch is immediately activated in the pharmacy catalog.
  - Pharmacist can now sell from batch `CP-9901`.
  - Audit log records approval timestamp and admin user ID.

### TC-ADM-003: Rejecting Invalid Stock Request
- **Steps:**
  1. Locate a pending request.
  2. Enter Comment: *"Vendor price too high - renegotiate"*.
  3. Click **"Reject Request"**.
- **Expected Result:**
  - Status updates to `REJECTED`.
  - Batch is not added to inventory.
  - Comment is preserved in history.

### TC-ADM-004: Daily Sales Reconciliation Report (Clinical vs. Pharmacy)
- **Steps:**
  1. Switch to **"Daily Sales & Reconciliation Report"** tab.
  2. Select Date: Today.
- **Expected Result:**
  - Compares:
    - **Receptionist Drawer:** Total Rs. collected from clinical tickets.
    - **Pharmacist Drawer:** Total Rs. collected from medicine sales.
    - **Combined Hospital Total:** Grand total cash generated.
  - Matches individual transaction breakdown below.

### TC-ADM-005: Date Range & Historical Presets
- **Steps:**
  1. Click preset buttons: **"Today"**, **"Yesterday"**, **"2 Days Ago"**, or custom date picker.
- **Expected Result:**
  - Report dynamically loads the historical transactions and daily closing numbers for that specific day.

### TC-ADM-006: Daily Closing Report Print Layout (A4 & ESC/POS)
- **Steps:**
  1. On the Daily Report, click **"Print Daily Closing Report"**.
- **Expected Result:**
  - Clean print stylesheet is applied (`@media print`).
  - Hides UI navigation and action buttons.
  - Formatted for executive signing: includes Signature Lines for Receptionist, Pharmacist, and Admin Auditor.

### TC-ADM-007: RFC 4180 CSV Data Export
- **Steps:**
  1. Click **"Export CSV Report"** under:
     - Invoices
     - Pharmacy Sales
     - Inventory Batches
     - Audit Trail
- **Expected Result:**
  - Browser downloads a well-formatted `.csv` file.
  - Opening in Microsoft Excel or LibreOffice Calc reveals properly separated columns, timestamps, and currency amounts without encoding corruption.

### TC-ADM-008: Immutable Audit Trail Inspection
- **Steps:**
  1. Switch to the **"Audit Trail"** tab.
  2. Search for `LOGIN`, `PATIENT_REGISTERED`, `INVOICE_CREATED`, `STOCK_APPROVED`.
- **Expected Result:**
  - Every clinical, financial, and user action is logged with user name, email, IP, action, details, and exact timestamp.
  - Audit log records cannot be edited or deleted from the UI.

### TC-ADM-009: User Roster & Staff Account Management
- **Steps:**
  1. Switch to **"Users & Staff Accounts"** tab.
  2. Click **"+ Add Staff Account"**.
  3. Enter Name: `Saima Bibi`, Email: `saima.reception@hms.local`, Role: `RECEPTIONIST`, Password: `Password@2026`.
  4. Submit.
- **Expected Result:**
  - New user appears in roster.
  - Logging out and signing in with the new credentials grants correct receptionist access.

### TC-ADM-010: Profit & Loss / Margin Estimator
- **Steps:**
  1. Check the Inventory & Sales Margin section on the Admin dashboard.
- **Expected Result:**
  - Compares medicine purchase price vs. selling price to show gross pharmacy profit margin.

---

## Module 6: End-to-End Cross-Departmental Workflows (The Patient Journey)

### TC-E2E-001: The Complete Hospital Lifecycle
- **Scenario:** A patient walks in, gets registered, pays OPD fee, sees the doctor, gets prescribed medicine, buys from the pharmacy, and the admin audits the transaction.
- **Execution Steps:**
  1. **Reception (`Adnan Ahmed`):**
     - Register `Bashir Ahmed`, Phone: `0321-7654321`, Age: `45`, Male.
     - System assigns UID `PAT-2026-0002`.
     - Issue General OPD Consultation invoice (Rs. 500). Cash tendered: Rs. 500.
     - Print receipt.
  2. **Doctor Room (`Dr. Tariq Khan`):**
     - Open `/doctor`, select `Bashir Ahmed (PAT-2026-0002)`.
     - Review OPD visit ticket.
     - Record Diagnosis: `Type 2 Diabetes Mellitus with Peripheral Neuropathy`.
     - Prescribe: `Metformin 500mg 1+0+1, Mecobalamin 500mcg 1+0+0`.
     - Save clinical note.
  3. **Dispensary (`Muhammad Tariq`):**
     - Open `/pharmacist`.
     - Enter Patient UID: `PAT-2026-0002` -> Patient is linked.
     - Search & add *Metformin 500mg Generic* (2 packs, Rs. 180 - 5% discount) and *Mecobalamin* (1 pack, Rs. 350).
     - Net Total: `Rs. 521`.
     - Tender cash: `Rs. 1000`. Change: `Rs. 479`.
     - Checkout & print dispensary receipt.
  4. **Audit (`Abu Bakar Admin`):**
     - Open `/admin` -> Daily Sales Reconciliation.
     - Verify Reception ledger reflects Rs. 500.
     - Verify Pharmacy ledger reflects Rs. 521.
     - Verify Total Hospital Revenue for Bashir Ahmed = Rs. 1,021.
     - Open Bashir Ahmed's record -> Confirm full history contains OPD ticket, doctor notes, and pharmacy receipt.
- **Expected Result:**
  - Zero data mismatch between departments.
  - Lifelong medical record is complete.
  - Cash collected matches physical money in both drawers.

### TC-E2E-002: Ultrasound Procedure Workflow
- **Steps:**
  1. Receptionist issues an **"Obstetric / Fetal Ultrasound (Rs. 1800)"** invoice.
  2. Patient proceeds to Doctor's Ultrasound clinic room.
  3. Doctor enters Ultrasound report findings into the patient's visit dossier.
- **Expected Result:**
  - Service type clearly distinguishes Ultrasound from OPD.
  - Clinical report is saved with the visit.

### TC-E2E-003: Emergency Patient Fast-Track Intake
- **Steps:**
  1. Receptionist selects **"Emergency Triage & Vitals (Rs. 800)"**.
  2. Invoices immediately and flags ticket as Emergency.
- **Expected Result:**
  - Ticket is immediately visible on Doctor portal with priority.

### TC-E2E-004: Same-Day Return Visit & Repeat Medication
- **Steps:**
  1. Patient returns in the evening for another medicine refill.
  2. Pharmacist enters existing UID without creating a new patient record.
- **Expected Result:**
  - New sale is appended to the patient's existing history without duplicate records.

---

## Module 7: Real-World Human Errors, Stress & Edge-Case Scenarios

### TC-EDGE-001: Insufficient Cash Tendered
- **Steps:**
  1. At Reception, service fee is `Rs. 1500`.
  2. Receptionist accidentally enters Cash Tendered: `Rs. 500`.
- **Expected Result:**
  - UI shows warning: *"Cash tendered is less than amount due (Short by Rs. 1,000)"*.
  - Checkout button remains disabled or warns before proceeding.

### TC-EDGE-002: Duplicate Patient Phone Registration
- **Steps:**
  1. Attempt to register a new patient with the exact same name and phone number as an existing patient.
- **Expected Result:**
  - System prompts: *"Patient with this phone number already exists: [UID]. Open existing profile instead?"*

### TC-EDGE-003: Accidental Browser Refresh During Checkout
- **Steps:**
  1. At Pharmacy POS, add 4 items to the cart.
  2. Press `F5` / Refresh the browser page before clicking Checkout.
- **Expected Result:**
  - Either cart is preserved via state storage, or cleanly reinitialized without orphan DB transactions or incorrect stock deductions.

### TC-EDGE-004: Concurrent Sales of the Last Stock Item
- **Scenario:** Two pharmacy counter terminals attempt to sell the last 1 remaining unit of a medicine at the exact same second.
- **Steps:**
  1. Stock = 1 unit.
  2. Terminal A clicks Checkout.
  3. Terminal B clicks Checkout 1 second later.
- **Expected Result:**
  - Terminal A's transaction succeeds.
  - Terminal B receives a clear message: *"Stock insufficient. Item was just sold out on another terminal."*
  - Inventory count never drops below 0 (No negative inventory).

### TC-EDGE-005: Rapid Double-Click on "Issue Invoice" Button
- **Steps:**
  1. Fill invoice form.
  2. Double-click or triple-click the **"Issue Invoice"** button rapidly.
- **Expected Result:**
  - Button immediately enters disabled / loading state upon first click.
  - Exactly **one** invoice is generated in the database (no duplicate billing).

### TC-EDGE-006: Extreme Input Values & Text Sanitization
- **Steps:**
  1. Patient Name: Enter `Muhammad <script>alert('XSS')</script> Khan`.
  2. Age: Enter `999`.
  3. Discount: Enter negative number `-500` or number larger than fee `999999`.
- **Expected Result:**
  - XSS payload is sanitized and safely escaped as plain text.
  - Age > 125 is flagged with a sensible warning.
  - Discount cannot be negative and cannot exceed the subtotal.

### TC-EDGE-007: Database Disconnect / Offline Recovery
- **Steps:**
  1. Temporarily stop the database service (`docker compose stop postgres`).
  2. Trigger an action in the browser.
  3. Restart the database (`docker compose start postgres`).
- **Expected Result:**
  - Graceful error banner: *"Database service is temporarily unreachable. Please retry in a moment."*
  - No uncaught white-screen crash.
  - Once Postgres restarts, the web application reconnects automatically without requiring a full server reboot.

### TC-EDGE-008: Decimal Currency & Rounding Precision
- **Steps:**
  1. Sell an item priced at `Rs. 33.33` with 5% discount (`Rs. 1.6665`).
- **Expected Result:**
  - System rounds consistently to 2 decimal places (PKR standard) without fractional cent leakage.

### TC-EDGE-009: High-Volume Search Performance
- **Steps:**
  1. Type single letters into the medicine search box rapidly (`A` -> `Am` -> `Amo` -> `Amox`).
- **Expected Result:**
  - Search input is debounced.
  - UI remains responsive at 60fps without freezing or lagging.

---

## Module 8: Hardware, Print & Local Hospital Network Scenarios

### TC-PRINT-001: Standard 80mm ESC/POS Thermal Receipt Layout
- **Steps:**
  1. Open thermal receipt preview.
  2. Press `Ctrl+P` or click Print.
- **Expected Result:**
  - Content width strictly aligns to 80mm (approx 300px-350px).
  - High-contrast black & white styling.
  - Zero margin overflow or horizontal cut-off.
  - Clinic name, phone, invoice number, and barcoded/receipt UID are sharp and legible.

### TC-PRINT-002: User Cancels Print Dialog
- **Steps:**
  1. In the receipt modal, click Print.
  2. In the OS print preview dialog, click **"Cancel"**.
- **Expected Result:**
  - The application handles cancellation cleanly.
  - The modal remains open with option to retry or proceed to the next patient.

### TC-PRINT-003: Multi-Terminal Access over Hospital LAN
- **Steps:**
  1. Find the hospital server's static IP (e.g. `192.168.1.100`).
  2. On a second laptop connected to the clinic Wi-Fi/LAN, open `http://192.168.1.100:3000`.
  3. Log in as Pharmacist while the main server runs Receptionist.
- **Expected Result:**
  - Both terminals operate simultaneously in real time over the local network.
  - Changes made on Terminal A (new patient) appear on Terminal B within seconds.

### TC-PRINT-004: Local Offline Server Operation (No Public Internet)
- **Steps:**
  1. Disconnect the WAN / DSL cable from the hospital Wi-Fi router (pure offline local network).
  2. Perform full patient intake, doctor notes, POS sales, and receipt printing.
- **Expected Result:**
  - System operates with 100% functionality.
  - No external CDN or internet dependency blocks operations.

### TC-PRINT-005: Thermal Printer Paper Out Mid-Print
- **Steps:**
  1. Remove paper roll from the thermal printer.
  2. Trigger receipt print.
  3. Re-insert paper.
- **Expected Result:**
  - Receptionist can use the **"Reprint"** button on the screen once paper is refilled without re-creating the transaction.

---

## 3. QA Defect Reporting Template

When human testers find a defect, record it in the format below:

```markdown
### Bug Report: [Short Title]
- **Bug ID:** BUG-HMS-XXXX
- **Module:** [Reception | Doctor | Pharmacy | Admin | Auth]
- **Severity:** [Critical / High / Medium / Low]
- **Preconditions:** [User logged in, patient created, etc.]
- **Steps to Reproduce:**
  1. Step one
  2. Step two
  3. Step three
- **Expected Behavior:** [What should happen according to PRD]
- **Actual Behavior:** [What actually happened]
- **Browser & OS:** [e.g. Chrome 120 on Ubuntu 24.04 / Windows 11]
- **Screenshot / Console Logs:** [Attach or paste logs]
```

---

## 4. Final UAT Sign-Off Certificate

| Department | Designated Human Tester | Signature | Date | Decision |
| :--- | :--- | :--- | :--- | :---: |
| **Clinical Reception** | Lead Receptionist | ____________________ | ___/___/2026 | [ ] PASS / [ ] REJECT |
| **Outpatient Clinic** | Medical Officer / Physician | ____________________ | ___/___/2026 | [ ] PASS / [ ] REJECT |
| **Hospital Pharmacy** | Chief Pharmacist | ____________________ | ___/___/2026 | [ ] PASS / [ ] REJECT |
| **Hospital Administration**| Medical Superintendent / Auditor | ____________________ | ___/___/2026 | [ ] PASS / [ ] REJECT |

