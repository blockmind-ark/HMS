# Implementation Task Backlog for Codex

- [x] **Task 1: Project Scaffolding & Database Setup**
  - [x] Initialize Next.js app with TypeScript and Tailwind CSS.
  - [x] Configure Prisma ORM with PostgreSQL and apply schema (`prisma/schema.prisma`).
  - [x] Create database seeding script (`prisma/seed.ts`) with default users (Admin, Receptionist, Pharmacist), sample patients, medicines, and initial stock batches.

- [x] **Task 2: Authentication & RBAC Middleware**
  - [x] Implement NextAuth.js credentials authentication supporting role claims.
  - [x] Create middleware to protect route groups: `/admin/*`, `/receptionist/*`, `/pharmacist/*`.
  - [x] Build universal login page (`/login`) with 1-click demo role-switchers and automatic post-login redirection.

- [x] **Task 3: Receptionist Portal**
  - [x] Build patient registration form with auto-generated Patient UID (`PAT-YYYY-XXXX`).
  - [x] Implement biometric simulation modal for optical fingerprint enrollment and instant scan lookup.
  - [x] Build visit creation interface (OPD, Ultrasound, Consultation) and checkout tender calculator.
  - [x] Implement sequential invoice generator (`INV-YYYY-XXXX`) and ESC/POS thermal receipt print layout (`window.print()`).
  - [x] Build Patient Directory & Medical History archive.

- [x] **Task 4: Pharmacist Portal (POS & Inventory)**
  - [x] Build POS billing screen with instant medicine search (by brand and generic formulation).
  - [x] Implement auto-applied 5% discount logic for generic medicines with visual indicators.
  - [x] Build patient UID lookup to link pharmacy purchase with hospital patient record.
  - [x] Build stock batch inventory view and request submission form (pending admin approval).
  - [x] Implement ESC/POS thermal receipt modal for dispensary sales.

- [x] **Task 5: Admin Portal & Approvals Center**
  - [x] Build approvals dashboard for pending stock/purchase requests (Approve/Reject with comments & inventory activation).
  - [x] Build financial and operational reporting dashboard (combined revenue, visits, top selling medicines, profit/loss statement, profit margins).
  - [x] Build Daily Sales & Reconciliation Audit report option comparing both Clinical Reception invoices and Pharmaceutical Dispensary sales.
  - [x] Implement date picker with quick day presets ("Today", "Yesterday", "2 Days Ago") and ESC/POS & A4 print audit layout.
  - [x] Implement RFC 4180 CSV export for daily reconciliation reports, visits, invoices, sales reports, inventory batches, and audit trail.
  - [x] Build immutable Audit Log viewer with search and action filtering.
