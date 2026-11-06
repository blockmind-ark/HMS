# Product Requirements Document (PRD): Hospital & Pharmacy Management System (HMS)

## 1. Overview
An integrated, role-based Hospital & Pharmacy Management System designed to eliminate paper trails, cash leakage, and compliance risks by unifying patient registration, clinical visits, pharmacy POS, and administrative oversight under a single database and secure RBAC framework.

## 2. User Roles & Access Control
- **RECEPTIONIST:** Register patients, simulate biometric fingerprint scan, create visits, issue OPD/Ultrasound service invoices, print thermal receipts, view patient history.
- **PHARMACIST:** Pharmacy POS billing, patient UID lookup, 5% generic discount application, batch inventory management, submit low-stock/purchase/inventory requests to Admin.
- **ADMIN:** Full system access, approvals center for pharmacist requests, financial & operational dashboards, profit/loss tracking, user/role management, audit logs, and CSV data export.

## 3. Key Functional Modules
- **Patient Management:** Unique Patient ID (UID) generated upon biometric/demographic registration. Lifelong visit and billing history trail.
- **Billing & Invoicing:** Sequential invoice numbering, itemized billing, thermal receipt printing template.
- **Pharmacy POS & Inventory:** Batch-level stock tracking (pricing, mfg date, expiry date), low-stock thresholds, and vendor purchase order requests.
- **Audit & Compliance:** Immutable audit logs tracking user activity, timestamped transactions, and approval workflows.