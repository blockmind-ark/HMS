--
-- PostgreSQL database dump
--

\restrict NADgBaYuMizOibv3QI1W8tXaCRxVNbjEgJtuPQyVDC5WVZUkeDEwrUub32ZdI19

-- Dumped from database version 15.19
-- Dumped by pg_dump version 15.19

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public."Visit" DROP CONSTRAINT IF EXISTS "Visit_tokenId_fkey";
ALTER TABLE IF EXISTS ONLY public."Visit" DROP CONSTRAINT IF EXISTS "Visit_patientId_fkey";
ALTER TABLE IF EXISTS ONLY public."VendorPayment" DROP CONSTRAINT IF EXISTS "VendorPayment_vendorId_fkey";
ALTER TABLE IF EXISTS ONLY public."VendorPayment" DROP CONSTRAINT IF EXISTS "VendorPayment_purchaseOrderId_fkey";
ALTER TABLE IF EXISTS ONLY public."VendorPayment" DROP CONSTRAINT IF EXISTS "VendorPayment_paidById_fkey";
ALTER TABLE IF EXISTS ONLY public."UserBiometricEnrollment" DROP CONSTRAINT IF EXISTS "UserBiometricEnrollment_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."StockBatch" DROP CONSTRAINT IF EXISTS "StockBatch_medicineId_fkey";
ALTER TABLE IF EXISTS ONLY public."ShiftClosing" DROP CONSTRAINT IF EXISTS "ShiftClosing_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."ShiftClosing" DROP CONSTRAINT IF EXISTS "ShiftClosing_approvedById_fkey";
ALTER TABLE IF EXISTS ONLY public."PurchaseOrder" DROP CONSTRAINT IF EXISTS "PurchaseOrder_vendorId_fkey";
ALTER TABLE IF EXISTS ONLY public."PurchaseOrderItem" DROP CONSTRAINT IF EXISTS "PurchaseOrderItem_purchaseOrderId_fkey";
ALTER TABLE IF EXISTS ONLY public."PharmacySale" DROP CONSTRAINT IF EXISTS "PharmacySale_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."PharmacySale" DROP CONSTRAINT IF EXISTS "PharmacySale_patientId_fkey";
ALTER TABLE IF EXISTS ONLY public."PharmacySaleItem" DROP CONSTRAINT IF EXISTS "PharmacySaleItem_saleId_fkey";
ALTER TABLE IF EXISTS ONLY public."PharmacySaleItem" DROP CONSTRAINT IF EXISTS "PharmacySaleItem_medicineId_fkey";
ALTER TABLE IF EXISTS ONLY public."PatientBiometricEnrollment" DROP CONSTRAINT IF EXISTS "PatientBiometricEnrollment_patientId_fkey";
ALTER TABLE IF EXISTS ONLY public."Invoice" DROP CONSTRAINT IF EXISTS "Invoice_visitId_fkey";
ALTER TABLE IF EXISTS ONLY public."Invoice" DROP CONSTRAINT IF EXISTS "Invoice_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Invoice" DROP CONSTRAINT IF EXISTS "Invoice_tokenId_fkey";
ALTER TABLE IF EXISTS ONLY public."Invoice" DROP CONSTRAINT IF EXISTS "Invoice_patientId_fkey";
ALTER TABLE IF EXISTS ONLY public."InvoiceItem" DROP CONSTRAINT IF EXISTS "InvoiceItem_invoiceId_fkey";
ALTER TABLE IF EXISTS ONLY public."Expenditure" DROP CONSTRAINT IF EXISTS "Expenditure_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."DrawerAdjustment" DROP CONSTRAINT IF EXISTS "DrawerAdjustment_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."DrawerAdjustment" DROP CONSTRAINT IF EXISTS "DrawerAdjustment_approvedById_fkey";
ALTER TABLE IF EXISTS ONLY public."DailyTokenLog" DROP CONSTRAINT IF EXISTS "DailyTokenLog_patientId_fkey";
ALTER TABLE IF EXISTS ONLY public."DailyTokenLog" DROP CONSTRAINT IF EXISTS "DailyTokenLog_issuedById_fkey";
ALTER TABLE IF EXISTS ONLY public."BiometricCredential" DROP CONSTRAINT IF EXISTS "BiometricCredential_patientId_fkey";
ALTER TABLE IF EXISTS ONLY public."AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."ApprovalRequest" DROP CONSTRAINT IF EXISTS "ApprovalRequest_requestedById_fkey";
DROP INDEX IF EXISTS public."Vendor_name_key";
DROP INDEX IF EXISTS public."VendorPayment_paymentNumber_key";
DROP INDEX IF EXISTS public."User_email_key";
DROP INDEX IF EXISTS public."UserBiometricEnrollment_userId_fingerPosition_key";
DROP INDEX IF EXISTS public."PurchaseOrder_poNumber_key";
DROP INDEX IF EXISTS public."PharmacySale_saleNumber_key";
DROP INDEX IF EXISTS public."Patient_patientUid_key";
DROP INDEX IF EXISTS public."PatientBiometricEnrollment_patientId_fingerPosition_key";
DROP INDEX IF EXISTS public."Medicine_name_idx";
DROP INDEX IF EXISTS public."Medicine_itemType_idx";
DROP INDEX IF EXISTS public."Medicine_category_idx";
DROP INDEX IF EXISTS public."MedicineInventory_sNo_idx";
DROP INDEX IF EXISTS public."MedicineInventory_itemName_idx";
DROP INDEX IF EXISTS public."MedicineInventory_batchNo_idx";
DROP INDEX IF EXISTS public."Invoice_visitId_key";
DROP INDEX IF EXISTS public."Invoice_invoiceNumber_key";
DROP INDEX IF EXISTS public."InventoryPurchase_itemName_idx";
DROP INDEX IF EXISTS public."InventoryPurchase_batchNo_idx";
DROP INDEX IF EXISTS public."DailyTokenLog_tokenNumber_idx";
DROP INDEX IF EXISTS public."DailyTokenLog_status_idx";
DROP INDEX IF EXISTS public."DailyTokenLog_patientId_idx";
DROP INDEX IF EXISTS public."DailyTokenLog_dateStr_idx";
DROP INDEX IF EXISTS public."DailyTokenCounter_dateStr_key";
DROP INDEX IF EXISTS public."DailyTokenCounter_dateStr_idx";
DROP INDEX IF EXISTS public."BiometricCredential_credentialId_key";
DROP INDEX IF EXISTS public."BiometricChallenge_challenge_key";
ALTER TABLE IF EXISTS ONLY public."Visit" DROP CONSTRAINT IF EXISTS "Visit_pkey";
ALTER TABLE IF EXISTS ONLY public."Vendor" DROP CONSTRAINT IF EXISTS "Vendor_pkey";
ALTER TABLE IF EXISTS ONLY public."VendorPayment" DROP CONSTRAINT IF EXISTS "VendorPayment_pkey";
ALTER TABLE IF EXISTS ONLY public."User" DROP CONSTRAINT IF EXISTS "User_pkey";
ALTER TABLE IF EXISTS ONLY public."UserBiometricEnrollment" DROP CONSTRAINT IF EXISTS "UserBiometricEnrollment_pkey";
ALTER TABLE IF EXISTS ONLY public."StockBatch" DROP CONSTRAINT IF EXISTS "StockBatch_pkey";
ALTER TABLE IF EXISTS ONLY public."ShiftClosing" DROP CONSTRAINT IF EXISTS "ShiftClosing_pkey";
ALTER TABLE IF EXISTS ONLY public."PurchaseOrder" DROP CONSTRAINT IF EXISTS "PurchaseOrder_pkey";
ALTER TABLE IF EXISTS ONLY public."PurchaseOrderItem" DROP CONSTRAINT IF EXISTS "PurchaseOrderItem_pkey";
ALTER TABLE IF EXISTS ONLY public."PharmacySale" DROP CONSTRAINT IF EXISTS "PharmacySale_pkey";
ALTER TABLE IF EXISTS ONLY public."PharmacySaleItem" DROP CONSTRAINT IF EXISTS "PharmacySaleItem_pkey";
ALTER TABLE IF EXISTS ONLY public."Patient" DROP CONSTRAINT IF EXISTS "Patient_pkey";
ALTER TABLE IF EXISTS ONLY public."PatientBiometricEnrollment" DROP CONSTRAINT IF EXISTS "PatientBiometricEnrollment_pkey";
ALTER TABLE IF EXISTS ONLY public."Medicine" DROP CONSTRAINT IF EXISTS "Medicine_pkey";
ALTER TABLE IF EXISTS ONLY public."MedicineInventory" DROP CONSTRAINT IF EXISTS "MedicineInventory_pkey";
ALTER TABLE IF EXISTS ONLY public."Invoice" DROP CONSTRAINT IF EXISTS "Invoice_pkey";
ALTER TABLE IF EXISTS ONLY public."InvoiceItem" DROP CONSTRAINT IF EXISTS "InvoiceItem_pkey";
ALTER TABLE IF EXISTS ONLY public."InventoryPurchase" DROP CONSTRAINT IF EXISTS "InventoryPurchase_pkey";
ALTER TABLE IF EXISTS ONLY public."Expenditure" DROP CONSTRAINT IF EXISTS "Expenditure_pkey";
ALTER TABLE IF EXISTS ONLY public."DrawerAdjustment" DROP CONSTRAINT IF EXISTS "DrawerAdjustment_pkey";
ALTER TABLE IF EXISTS ONLY public."DailyTokenLog" DROP CONSTRAINT IF EXISTS "DailyTokenLog_pkey";
ALTER TABLE IF EXISTS ONLY public."DailyTokenCounter" DROP CONSTRAINT IF EXISTS "DailyTokenCounter_pkey";
ALTER TABLE IF EXISTS ONLY public."BiometricCredential" DROP CONSTRAINT IF EXISTS "BiometricCredential_pkey";
ALTER TABLE IF EXISTS ONLY public."BiometricChallenge" DROP CONSTRAINT IF EXISTS "BiometricChallenge_pkey";
ALTER TABLE IF EXISTS ONLY public."AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_pkey";
ALTER TABLE IF EXISTS ONLY public."ApprovalRequest" DROP CONSTRAINT IF EXISTS "ApprovalRequest_pkey";
DROP TABLE IF EXISTS public."Visit";
DROP TABLE IF EXISTS public."VendorPayment";
DROP TABLE IF EXISTS public."Vendor";
DROP TABLE IF EXISTS public."UserBiometricEnrollment";
DROP TABLE IF EXISTS public."User";
DROP TABLE IF EXISTS public."StockBatch";
DROP TABLE IF EXISTS public."ShiftClosing";
DROP TABLE IF EXISTS public."PurchaseOrderItem";
DROP TABLE IF EXISTS public."PurchaseOrder";
DROP TABLE IF EXISTS public."PharmacySaleItem";
DROP TABLE IF EXISTS public."PharmacySale";
DROP TABLE IF EXISTS public."PatientBiometricEnrollment";
DROP TABLE IF EXISTS public."Patient";
DROP TABLE IF EXISTS public."MedicineInventory";
DROP TABLE IF EXISTS public."Medicine";
DROP TABLE IF EXISTS public."InvoiceItem";
DROP TABLE IF EXISTS public."Invoice";
DROP TABLE IF EXISTS public."InventoryPurchase";
DROP TABLE IF EXISTS public."Expenditure";
DROP TABLE IF EXISTS public."DrawerAdjustment";
DROP TABLE IF EXISTS public."DailyTokenLog";
DROP TABLE IF EXISTS public."DailyTokenCounter";
DROP TABLE IF EXISTS public."BiometricCredential";
DROP TABLE IF EXISTS public."BiometricChallenge";
DROP TABLE IF EXISTS public."AuditLog";
DROP TABLE IF EXISTS public."ApprovalRequest";
DROP TYPE IF EXISTS public."TokenType";
DROP TYPE IF EXISTS public."TokenStatus";
DROP TYPE IF EXISTS public."ShiftStatus";
DROP TYPE IF EXISTS public."Role";
DROP TYPE IF EXISTS public."PurchaseOrderStatus";
DROP TYPE IF EXISTS public."PortalType";
DROP TYPE IF EXISTS public."PaymentStatus";
DROP TYPE IF EXISTS public."DrawerAdjustmentType";
DROP TYPE IF EXISTS public."ApprovalStatus";
--
-- Name: ApprovalStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ApprovalStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'CANCELLED'
);


ALTER TYPE public."ApprovalStatus" OWNER TO postgres;

--
-- Name: DrawerAdjustmentType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DrawerAdjustmentType" AS ENUM (
    'CASH_IN',
    'CASH_OUT'
);


ALTER TYPE public."DrawerAdjustmentType" OWNER TO postgres;

--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'UNPAID',
    'PARTIAL',
    'PAID'
);


ALTER TYPE public."PaymentStatus" OWNER TO postgres;

--
-- Name: PortalType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PortalType" AS ENUM (
    'RECEPTION',
    'PHARMACY'
);


ALTER TYPE public."PortalType" OWNER TO postgres;

--
-- Name: PurchaseOrderStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PurchaseOrderStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'DELIVERED',
    'CANCELLED'
);


ALTER TYPE public."PurchaseOrderStatus" OWNER TO postgres;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Role" AS ENUM (
    'ADMIN',
    'RECEPTIONIST',
    'PHARMACIST',
    'DOCTOR'
);


ALTER TYPE public."Role" OWNER TO postgres;

--
-- Name: ShiftStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ShiftStatus" AS ENUM (
    'PENDING_APPROVAL',
    'APPROVED',
    'REJECTED',
    'OPEN',
    'CLOSED'
);


ALTER TYPE public."ShiftStatus" OWNER TO postgres;

--
-- Name: TokenStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TokenStatus" AS ENUM (
    'ISSUED',
    'CANCELLED'
);


ALTER TYPE public."TokenStatus" OWNER TO postgres;

--
-- Name: TokenType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TokenType" AS ENUM (
    'MANUAL_RESERVED',
    'AUTO_SEQUENCE'
);


ALTER TYPE public."TokenType" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ApprovalRequest; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ApprovalRequest" (
    id text NOT NULL,
    type text NOT NULL,
    details text NOT NULL,
    "requestedById" text NOT NULL,
    status public."ApprovalStatus" DEFAULT 'PENDING'::public."ApprovalStatus" NOT NULL,
    comment text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ApprovalRequest" OWNER TO postgres;

--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AuditLog" (
    id text NOT NULL,
    "userId" text NOT NULL,
    action text NOT NULL,
    details text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AuditLog" OWNER TO postgres;

--
-- Name: BiometricChallenge; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."BiometricChallenge" (
    id text NOT NULL,
    challenge text NOT NULL,
    "patientId" text,
    purpose text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."BiometricChallenge" OWNER TO postgres;

--
-- Name: BiometricCredential; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."BiometricCredential" (
    id text NOT NULL,
    "patientId" text NOT NULL,
    "credentialId" text NOT NULL,
    "publicKey" text NOT NULL,
    counter integer DEFAULT 0 NOT NULL,
    "deviceType" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."BiometricCredential" OWNER TO postgres;

--
-- Name: DailyTokenCounter; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DailyTokenCounter" (
    id text NOT NULL,
    "dateStr" text NOT NULL,
    "lastAutoNumber" integer DEFAULT 4 NOT NULL,
    "issuedManualTokens" integer[] DEFAULT ARRAY[]::integer[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."DailyTokenCounter" OWNER TO postgres;

--
-- Name: DailyTokenLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DailyTokenLog" (
    id text NOT NULL,
    "dateStr" text NOT NULL,
    "tokenNumber" integer NOT NULL,
    "tokenType" public."TokenType" NOT NULL,
    status public."TokenStatus" DEFAULT 'ISSUED'::public."TokenStatus" NOT NULL,
    "issuedById" text NOT NULL,
    "patientId" text,
    fee double precision DEFAULT 300 NOT NULL,
    services jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."DailyTokenLog" OWNER TO postgres;

--
-- Name: DrawerAdjustment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DrawerAdjustment" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type public."DrawerAdjustmentType" NOT NULL,
    amount double precision NOT NULL,
    remarks text NOT NULL,
    status public."ApprovalStatus" DEFAULT 'PENDING'::public."ApprovalStatus" NOT NULL,
    "approvedById" text,
    "adminComment" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."DrawerAdjustment" OWNER TO postgres;

--
-- Name: Expenditure; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Expenditure" (
    id text NOT NULL,
    "userId" text NOT NULL,
    portal public."PortalType" NOT NULL,
    amount double precision NOT NULL,
    category text NOT NULL,
    remarks text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Expenditure" OWNER TO postgres;

--
-- Name: InventoryPurchase; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."InventoryPurchase" (
    id text NOT NULL,
    "itemName" text NOT NULL,
    specification text NOT NULL,
    "pkgPacks" integer NOT NULL,
    "nosPerPack" integer NOT NULL,
    "totalCost" double precision NOT NULL,
    "perUnitCost" double precision NOT NULL,
    "perPackCost" double precision NOT NULL,
    "totalValue" double precision NOT NULL,
    "perUnitSellingPrice" double precision NOT NULL,
    "qtyPurchased" integer NOT NULL,
    threshold integer DEFAULT 10 NOT NULL,
    "perOff" double precision DEFAULT 0 NOT NULL,
    "batchNo" text NOT NULL,
    "expiryDate" timestamp(3) without time zone NOT NULL,
    "isCredit" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."InventoryPurchase" OWNER TO postgres;

--
-- Name: Invoice; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Invoice" (
    id text NOT NULL,
    "invoiceNumber" text NOT NULL,
    "patientId" text NOT NULL,
    "visitId" text,
    "tokenId" text,
    "userId" text NOT NULL,
    "totalAmount" double precision NOT NULL,
    discount double precision DEFAULT 0 NOT NULL,
    "paymentMethod" text DEFAULT 'CASH'::text NOT NULL,
    status text DEFAULT 'PAID'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Invoice" OWNER TO postgres;

--
-- Name: InvoiceItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."InvoiceItem" (
    id text NOT NULL,
    "invoiceId" text NOT NULL,
    description text NOT NULL,
    quantity integer NOT NULL,
    price double precision NOT NULL
);


ALTER TABLE public."InvoiceItem" OWNER TO postgres;

--
-- Name: Medicine; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Medicine" (
    id text NOT NULL,
    name text NOT NULL,
    "genericName" text NOT NULL,
    category text NOT NULL,
    "itemType" text DEFAULT 'MEDICINE'::text NOT NULL,
    threshold integer DEFAULT 10 NOT NULL,
    "perOff" double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Medicine" OWNER TO postgres;

--
-- Name: MedicineInventory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."MedicineInventory" (
    id text NOT NULL,
    "sNo" integer NOT NULL,
    "itemName" text NOT NULL,
    "formPotencySpec" text NOT NULL,
    "pkgPacks" integer NOT NULL,
    "nosPerPack" integer NOT NULL,
    "totalCost" double precision NOT NULL,
    "perUnitCost" double precision NOT NULL,
    "perPackCost" double precision NOT NULL,
    "totalValue" double precision NOT NULL,
    "perUnitSelling" double precision NOT NULL,
    "qtyPurchased" integer NOT NULL,
    threshold integer DEFAULT 10 NOT NULL,
    "perOff" double precision DEFAULT 0 NOT NULL,
    "batchNo" text NOT NULL,
    "expiryDate" timestamp(3) without time zone NOT NULL,
    "isCredit" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."MedicineInventory" OWNER TO postgres;

--
-- Name: Patient; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Patient" (
    id text NOT NULL,
    "patientUid" text NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    age integer NOT NULL,
    gender text NOT NULL,
    cnic text,
    "biometricHash" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Patient" OWNER TO postgres;

--
-- Name: PatientBiometricEnrollment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PatientBiometricEnrollment" (
    id text NOT NULL,
    "patientId" text NOT NULL,
    "fingerPosition" text DEFAULT 'RIGHT_THUMB'::text NOT NULL,
    "encryptedTemplate" text NOT NULL,
    "templateAlgorithm" text DEFAULT 'ISO_19794_2_MINUTIAE'::text NOT NULL,
    "qualityScore" integer DEFAULT 90 NOT NULL,
    "scannerModel" text NOT NULL,
    "adapterType" text DEFAULT 'MOCK'::text NOT NULL,
    "enrolledById" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PatientBiometricEnrollment" OWNER TO postgres;

--
-- Name: PharmacySale; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PharmacySale" (
    id text NOT NULL,
    "saleNumber" text NOT NULL,
    "patientId" text,
    "userId" text NOT NULL,
    "totalAmount" double precision NOT NULL,
    discount double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PharmacySale" OWNER TO postgres;

--
-- Name: PharmacySaleItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PharmacySaleItem" (
    id text NOT NULL,
    "saleId" text NOT NULL,
    "medicineId" text NOT NULL,
    "itemType" text DEFAULT 'MEDICINE'::text,
    quantity integer NOT NULL,
    "unitPrice" double precision NOT NULL,
    "totalPrice" double precision NOT NULL
);


ALTER TABLE public."PharmacySaleItem" OWNER TO postgres;

--
-- Name: PurchaseOrder; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PurchaseOrder" (
    id text NOT NULL,
    "poNumber" text NOT NULL,
    "vendorId" text NOT NULL,
    "totalAmount" double precision NOT NULL,
    "paidAmount" double precision DEFAULT 0 NOT NULL,
    "paymentStatus" public."PaymentStatus" DEFAULT 'UNPAID'::public."PaymentStatus" NOT NULL,
    status public."PurchaseOrderStatus" DEFAULT 'APPROVED'::public."PurchaseOrderStatus" NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PurchaseOrder" OWNER TO postgres;

--
-- Name: PurchaseOrderItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PurchaseOrderItem" (
    id text NOT NULL,
    "purchaseOrderId" text NOT NULL,
    "medicineName" text NOT NULL,
    "genericName" text,
    quantity integer NOT NULL,
    "unitPrice" double precision NOT NULL,
    "totalPrice" double precision NOT NULL
);


ALTER TABLE public."PurchaseOrderItem" OWNER TO postgres;

--
-- Name: ShiftClosing; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ShiftClosing" (
    id text NOT NULL,
    "userId" text NOT NULL,
    portal public."PortalType" DEFAULT 'RECEPTION'::public."PortalType" NOT NULL,
    "shiftDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "totalSystemCash" double precision NOT NULL,
    "countedCash" double precision NOT NULL,
    variance double precision NOT NULL,
    notes text,
    status public."ShiftStatus" DEFAULT 'PENDING_APPROVAL'::public."ShiftStatus" NOT NULL,
    "approvedById" text,
    "adminComment" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ShiftClosing" OWNER TO postgres;

--
-- Name: StockBatch; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."StockBatch" (
    id text NOT NULL,
    "medicineId" text NOT NULL,
    "batchNumber" text NOT NULL,
    quantity integer NOT NULL,
    "purchasePrice" double precision NOT NULL,
    "sellingPrice" double precision NOT NULL,
    "perOff" double precision DEFAULT 0 NOT NULL,
    "mfgDate" timestamp(3) without time zone NOT NULL,
    "expiryDate" timestamp(3) without time zone NOT NULL,
    "approvalStatus" public."ApprovalStatus" DEFAULT 'PENDING'::public."ApprovalStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."StockBatch" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    role public."Role" DEFAULT 'RECEPTIONIST'::public."Role" NOT NULL,
    "biometricHash" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "displayPassword" text
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: UserBiometricEnrollment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UserBiometricEnrollment" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "fingerPosition" text DEFAULT 'RIGHT_INDEX'::text NOT NULL,
    "encryptedTemplate" text NOT NULL,
    "templateAlgorithm" text DEFAULT 'ISO_19794_2_MINUTIAE'::text NOT NULL,
    "qualityScore" integer DEFAULT 90 NOT NULL,
    "scannerModel" text NOT NULL,
    "adapterType" text DEFAULT 'MOCK'::text NOT NULL,
    "enrolledById" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."UserBiometricEnrollment" OWNER TO postgres;

--
-- Name: Vendor; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Vendor" (
    id text NOT NULL,
    name text NOT NULL,
    "contactPerson" text,
    phone text,
    email text,
    address text,
    balance double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Vendor" OWNER TO postgres;

--
-- Name: VendorPayment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."VendorPayment" (
    id text NOT NULL,
    "paymentNumber" text NOT NULL,
    "vendorId" text NOT NULL,
    "purchaseOrderId" text,
    amount double precision NOT NULL,
    "paymentMethod" text NOT NULL,
    "referenceNumber" text,
    notes text,
    "paidById" text NOT NULL,
    "paymentDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."VendorPayment" OWNER TO postgres;

--
-- Name: Visit; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Visit" (
    id text NOT NULL,
    "patientId" text NOT NULL,
    "tokenId" text,
    "serviceType" text NOT NULL,
    fee double precision NOT NULL,
    notes text,
    diagnosis text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Visit" OWNER TO postgres;

--
-- Data for Name: ApprovalRequest; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ApprovalRequest" (id, type, details, "requestedById", status, comment, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AuditLog" (id, "userId", action, details, "createdAt") FROM stdin;
cmw4y37mu009irnocor0bx16o	cmw4xf0ea0008896zsciiahzd	PRODUCTION_ENVIRONMENT_INITIALIZED	Production database prepared for hospital go-live. Operational values reset to 0. All 289 catalog medicines synchronized.	2026-11-06 12:22:46.374
cmwlq753q0001savbtec9xy5n	cmw4xf0ea0008896zsciiahzd	MEDICINE_UPDATED	Admin Hospital Administrator updated medicine AG-VONO: quantity = 1000 units, perOff = 0%, threshold = 25, sellingPrice = 17, purchasePrice = 13.	2026-11-18 06:13:57.783
cmwlq7jzc0003savbg02i02sh	cmw4xf0ea0008896zsciiahzd	MEDICINE_UPDATED	Admin Hospital Administrator updated medicine Acefyl: quantity = 900 units, perOff = 0%, threshold = 25, sellingPrice = 171, purchasePrice = 134.	2026-11-18 06:14:17.065
cmwlqq5j40005savb9hg940s8	cmw4xf0ea0008896zsciiahzd	MEDICINE_CSV_IMPORT	Hospital Administrator (ADMIN) validated and imported 1 medicine records from CSV file 'newupdatingmedicen.csv'.	2026-11-18 06:28:44.8
\.


--
-- Data for Name: BiometricChallenge; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."BiometricChallenge" (id, challenge, "patientId", purpose, "expiresAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: BiometricCredential; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."BiometricCredential" (id, "patientId", "credentialId", "publicKey", counter, "deviceType", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: DailyTokenCounter; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DailyTokenCounter" (id, "dateStr", "lastAutoNumber", "issuedManualTokens", "createdAt", "updatedAt") FROM stdin;
cmw4xbcfn0000wicqeg8deyna	2026-11-06	5	{}	2026-11-06 12:01:06.227	2026-11-06 12:16:35.29
cmwlp8s990000gtk3q3nexr4j	2026-11-18	4	{}	2026-11-18 05:47:14.83	2026-11-18 05:47:14.83
\.


--
-- Data for Name: DailyTokenLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DailyTokenLog" (id, "dateStr", "tokenNumber", "tokenType", status, "issuedById", "patientId", fee, services, "createdAt") FROM stdin;
\.


--
-- Data for Name: DrawerAdjustment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DrawerAdjustment" (id, "userId", type, amount, remarks, status, "approvedById", "adminComment", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Expenditure; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Expenditure" (id, "userId", portal, amount, category, remarks, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: InventoryPurchase; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."InventoryPurchase" (id, "itemName", specification, "pkgPacks", "nosPerPack", "totalCost", "perUnitCost", "perPackCost", "totalValue", "perUnitSellingPrice", "qtyPurchased", threshold, "perOff", "batchNo", "expiryDate", "isCredit", "createdAt", "updatedAt") FROM stdin;
cmw4y36c6000drnoc6bsug2jv	IV Cannula	22 Gauge (Blue) 0.9 x 25mm	12	50	42000	70	3500	57000	95	600	10	0	CAN-22G-2607	2028-05-31 00:00:00	t	2026-11-06 12:22:44.694	2026-11-06 12:22:44.694
cmw4y36c8000ernociqxcevqe	IV Cannula	24 Gauge (Yellow) Paediatric 0.7 x 19mm	8	50	30000	75	3750	42000	105	400	10	0	CAN-24G-2608	2028-03-31 00:00:00	f	2026-11-06 12:22:44.696	2026-11-06 12:22:44.696
cmw4y36ca000frnoca0611yl4	Dextrose Water 5%	500ml IV Infusion Bottle	20	1	2600	130	130	3300	165	20	10	0	DW5-500-2609	2027-10-31 00:00:00	f	2026-11-06 12:22:44.698	2026-11-06 12:22:44.698
cmw4y36cb000grnocy8x0eziy	Dextrose Water 5%	1000ml IV Infusion Bottle	15	1	2925	195	195	3600	240	15	10	0	DW5-100-2610	2027-11-30 00:00:00	f	2026-11-06 12:22:44.7	2026-11-06 12:22:44.7
cmw4y36cd000hrnoc9z336xqm	Normal Saline (NS 0.9%)	100ml Infusion Bottle	30	1	2850	95	95	3900	130	30	10	0	NS09-100-2611	2027-09-30 00:00:00	f	2026-11-06 12:22:44.701	2026-11-06 12:22:44.701
cmw4y36ce000irnoce8lv7hwl	Normal Saline (NS 0.9%)	500ml Infusion Bottle	50	1	6250	125	125	8000	160	50	10	0	NS09-500-2612	2027-10-31 00:00:00	t	2026-11-06 12:22:44.703	2026-11-06 12:22:44.703
cmw4y36cg000jrnoc0vzb7jlb	Normal Saline (NS 0.9%)	1000ml Infusion Bottle	40	1	7400	185	185	9400	235	40	10	0	NS09-1K-2613	2027-12-31 00:00:00	f	2026-11-06 12:22:44.704	2026-11-06 12:22:44.704
cmw4y36ci000krnoch20dxox8	Ringer's Lactate (RL)	500ml Infusion Bottle	30	1	4200	140	140	5400	180	30	10	0	RL-500-2614	2027-08-31 00:00:00	f	2026-11-06 12:22:44.706	2026-11-06 12:22:44.706
cmw4y36cj000lrnocqb8nlnf3	Ringer's Lactate (RL)	1000ml Infusion Bottle	25	1	5125	205	205	6500	260	25	10	0	RL-1000-2615	2027-08-31 00:00:00	t	2026-11-06 12:22:44.707	2026-11-06 12:22:44.707
cmw4y36ck000mrnocmi4npcyu	Abdomen Sponge	30 x 30 cm 12-Ply X-Ray Detectable	20	5	17000	170	850	22000	220	100	10	0	ABD-SP-2616	2029-01-31 00:00:00	f	2026-11-06 12:22:44.709	2026-11-06 12:22:44.709
cmw4y36cm000nrnoc6qtaxujt	Surgical Gauze	10 x 10 cm Sterile 8-Ply	25	10	11250	45	450	16250	65	250	10	0	GAU-10X-2617	2029-02-28 00:00:00	f	2026-11-06 12:22:44.71	2026-11-06 12:22:44.71
cmw4y36co000ornocxy9imw3b	Baby Feeder	Infant Bottle 120ml BPA Free	10	12	18000	150	1800	26400	220	120	10	0	BBY-FDR-2618	2030-01-01 00:00:00	t	2026-11-06 12:22:44.712	2026-11-06 12:22:44.712
cmw4y36cp000prnoc4kdcykey	Baby Suction Catheter	Size 6 Fr Thumb Control	10	20	11000	55	1100	17000	85	200	10	0	BSU-06F-2619	2028-07-31 00:00:00	f	2026-11-06 12:22:44.714	2026-11-06 12:22:44.714
cmw4y36cr000qrnocvif8fkv6	Cord Clamp	Umbilical Cord Clamp Sterile	5	100	12500	25	2500	22500	45	500	10	0	CRD-CLP-2620	2029-05-31 00:00:00	f	2026-11-06 12:22:44.715	2026-11-06 12:22:44.715
cmw4y36cs000rrnoczepjlto2	Diathermy Lead / Pencil	Monopolar / Bipolar Lead with Cable	5	10	22500	450	4500	31000	620	50	10	0	DIA-MON-2621	2028-11-30 00:00:00	t	2026-11-06 12:22:44.716	2026-11-06 12:22:44.716
cmw4y36bu0007rnocxt9b4h5o	Syringe	3 CC with 23G Needle	10	100	15000	15	1500	20000	20	1000	10	0	SYR-3CC-2601	2028-06-30 00:00:00	f	2026-11-06 12:22:44.683	2026-11-06 12:22:44.683
cmw4y36bx0008rnocm7cnq0rn	Syringe	5 CC with 22G Needle	10	100	17000	17	1700	25000	25	1000	10	0	SYR-5CC-2602	2028-06-30 00:00:00	f	2026-11-06 12:22:44.685	2026-11-06 12:22:44.685
cmw4y36by0009rnocfhk0127n	Syringe	10 CC Luer Lock	10	50	14000	28	1400	19000	38	500	10	0	SYR-10C-2603	2028-08-31 00:00:00	t	2026-11-06 12:22:44.687	2026-11-06 12:22:44.687
cmw4y36c0000arnoca4h1k1a2	Cannula 3-Way Stopcock	Standard Luer Lock Sterile	5	50	11250	45	2250	16250	65	250	10	0	3WAY-2026-04	2027-12-31 00:00:00	f	2026-11-06 12:22:44.688	2026-11-06 12:22:44.688
cmw4y36c2000brnocclrd2z2r	IV Cannula	18 Gauge (Green) 1.3 x 45mm	10	50	35000	70	3500	47500	95	500	10	0	CAN-18G-2605	2028-04-30 00:00:00	t	2026-11-06 12:22:44.69	2026-11-06 12:22:44.69
cmw4y36c4000crnoc7mmmimqk	IV Cannula	20 Gauge (Pink) 1.1 x 32mm	15	50	52500	70	3500	71250	95	750	10	0	CAN-20G-2606	2028-05-31 00:00:00	f	2026-11-06 12:22:44.692	2026-11-06 12:22:44.692
cmw4y36ct000srnocn3k3dmbx	Foley Balloon Catheter	2-Way Silicone/Latex Size 16 Fr	10	10	22000	220	2200	31000	310	100	10	0	FOL-16F-2622	2028-09-30 00:00:00	f	2026-11-06 12:22:44.718	2026-11-06 12:22:44.718
cmw4y36cv000trnocfa48w8rc	Enema Syringe / Set	Kaleen Enema Pack 133ml	15	6	18000	200	1200	25200	280	90	10	0	ENM-SET-2623	2027-06-30 00:00:00	f	2026-11-06 12:22:44.719	2026-11-06 12:22:44.719
cmw4y36cw000urnocbvwz2k9n	IV Infusion Set	Classic Gravity 20 Drops/ml	15	25	24375	65	1625	33750	90	375	10	0	IVS-GRA-2624	2028-10-31 00:00:00	f	2026-11-06 12:22:44.72	2026-11-06 12:22:44.72
cmw4y36cx000vrnocna9dte96	IV Infusion Set	Y-Port Injection Site Needle-Free	10	25	21250	85	2125	30000	120	250	10	0	IVS-YPT-2625	2028-10-31 00:00:00	t	2026-11-06 12:22:44.722	2026-11-06 12:22:44.722
cmw4y36cy000wrnoczopn24qa	Contraceptive Implant	Jadelle / Implanon Rod 2-Rod Subdermal	4	5	58000	2900	14500	76000	3800	20	10	0	JAD-2RO-2626	2028-12-31 00:00:00	t	2026-11-06 12:22:44.723	2026-11-06 12:22:44.723
cmw4y36d0000xrnoc7u3u94bm	Nelaton Drain Catheter	Size 16 Fr Straight PVC	10	20	14000	70	1400	21000	105	200	10	0	NEL-16F-2627	2028-08-31 00:00:00	f	2026-11-06 12:22:44.724	2026-11-06 12:22:44.724
cmw4y36d1000yrnoc9znlv0yt	Nasogastric (NG) Tube	Size 6 Fr Infant Feeding Tube	8	10	9600	120	1200	14000	175	80	10	0	NGT-06F-2628	2028-04-30 00:00:00	f	2026-11-06 12:22:44.725	2026-11-06 12:22:44.725
cmw4y36d2000zrnocpmcxwb01	Ring Pessary	Size 2.5 / 2.7 Silicone Uterine Support	5	4	24000	1200	4800	33000	1650	20	10	0	PES-25S-2629	2029-12-31 00:00:00	f	2026-11-06 12:22:44.727	2026-11-06 12:22:44.727
cmw4y36d30010rnoc0axvs8d9	Surgical Suture	Chromic Catgut Size 1 75cm Round Bodied 40mm	8	12	22080	230	2760	29760	310	96	10	0	SUT-CAT-2630	2028-09-30 00:00:00	t	2026-11-06 12:22:44.728	2026-11-06 12:22:44.728
cmw4y36d50011rnocsmbi8q25	Surgical Suture	Chromic Catgut Size 2 75cm Heavy Reverse Cutting	8	12	23040	240	2880	30720	320	96	10	0	SUT-CAT-2631	2028-09-30 00:00:00	f	2026-11-06 12:22:44.729	2026-11-06 12:22:44.729
cmw4y36d60012rnoc7rd1welj	Surgical Suture	Silk Braided Size 1 Black 75cm	10	12	22800	190	2280	31200	260	120	10	0	SUT-SLK-2632	2029-03-31 00:00:00	f	2026-11-06 12:22:44.73	2026-11-06 12:22:44.73
cmw4y36d70013rnoco9r14n48	Surgical Suture	Vicryl (Polyglactin) Size 1 Violet 90cm CT-1	10	12	50400	420	5040	67200	560	120	10	0	SUT-VIC-2633	2028-11-30 00:00:00	t	2026-11-06 12:22:44.732	2026-11-06 12:22:44.732
cmw4y36d80014rnoci6bjhpaz	Surgical Suture	Vicryl (Polyglactin) Size 2/0 70cm Taper Point	10	12	50400	420	5040	67200	560	120	10	0	SUT-VIC-2634	2028-11-30 00:00:00	f	2026-11-06 12:22:44.733	2026-11-06 12:22:44.733
cmw4y36da0015rnochz2rx4oe	Surgical Suture	Wego Prolene (Polypropylene) Size 1 Blue 100cm	6	12	23760	330	3960	31680	440	72	10	0	SUT-PRO-2635	2028-12-31 00:00:00	f	2026-11-06 12:22:44.734	2026-11-06 12:22:44.734
cmw4y36db0016rnocyz41p4ga	Surgical Suture	Wego Prolene (Polypropylene) Size 2/0 90cm	6	12	24480	340	4080	33120	460	72	10	0	SUT-PRO-2636	2028-12-31 00:00:00	t	2026-11-06 12:22:44.736	2026-11-06 12:22:44.736
cmw4y36dd0017rnocspc0qk0i	Skin Stapler	Sterile Disposable Stapler 35 Wide	5	6	21000	700	4200	28500	950	30	10	0	SKN-STP-2637	2028-10-31 00:00:00	f	2026-11-06 12:22:44.737	2026-11-06 12:22:44.737
cmw4y36de0018rnocpgz6t1tg	Spinal Needle	Lumbar Puncture 25G / 27G 90mm Quincke	5	20	18000	180	3600	26000	260	100	10	0	SPN-25G-2638	2028-06-30 00:00:00	t	2026-11-06 12:22:44.738	2026-11-06 12:22:44.738
cmw4y36dg0019rnoc6kyfbrev	Spongostan / Spongestone	Absorbable Haemostatic Gelatin Sponge 7 x 5 x 1 cm	4	10	26000	650	6500	35200	880	40	10	0	SPG-STD-2639	2028-03-31 00:00:00	f	2026-11-06 12:22:44.74	2026-11-06 12:22:44.74
cmw4y36dh001arnocvf1xwp3x	Suction Yankauer / Tube	Size 28 Fr Crown Tip + 2.5m Tubing	8	10	25600	320	3200	35200	440	80	10	0	SUC-YNK-2640	2028-12-31 00:00:00	f	2026-11-06 12:22:44.742	2026-11-06 12:22:44.742
cmw4y36dj001brnocyobugjv5	Surgical Scalpel Blade	Carbon/Stainless Blade No. 11 / 15	10	100	18000	18	1800	30000	30	1000	10	0	BLD-NO1-2641	2029-06-30 00:00:00	f	2026-11-06 12:22:44.743	2026-11-06 12:22:44.743
cmw4y36dk001crnocmy86qive	Surgical Gloves	Comfeel Size 6.5 Powder-Free Sterile Latex	10	50	37500	75	3750	55000	110	500	10	0	GLV-65C-2642	2028-05-31 00:00:00	t	2026-11-06 12:22:44.744	2026-11-06 12:22:44.744
cmw4y36dm001drnocntq644i9	Surgical Gloves	Comfeel Size 7.0 Powder-Free Sterile Latex	15	50	56250	75	3750	82500	110	750	10	0	GLV-70C-2643	2028-05-31 00:00:00	f	2026-11-06 12:22:44.746	2026-11-06 12:22:44.746
cmw4y36dn001ernocljvo234k	Surgical Gloves	Comfeel Size 7.5 Powder-Free Sterile Latex	12	50	45000	75	3750	66000	110	600	10	0	GLV-75C-2644	2028-05-31 00:00:00	f	2026-11-06 12:22:44.748	2026-11-06 12:22:44.748
cmw4y36dp001frnocbew9b00z	Urine Collection Drainage Bag	2000ml with Bottom Outlet T-Valve	10	20	19000	95	1900	29000	145	200	10	0	URN-2KL-2645	2028-11-30 00:00:00	t	2026-11-06 12:22:44.749	2026-11-06 12:22:44.749
\.


--
-- Data for Name: Invoice; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Invoice" (id, "invoiceNumber", "patientId", "visitId", "tokenId", "userId", "totalAmount", discount, "paymentMethod", status, "createdAt") FROM stdin;
\.


--
-- Data for Name: InvoiceItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."InvoiceItem" (id, "invoiceId", description, quantity, price) FROM stdin;
\.


--
-- Data for Name: Medicine; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Medicine" (id, name, "genericName", category, "itemType", threshold, "perOff", "createdAt") FROM stdin;
cmw4xhntz009n11ej755emm12	Syringe	10 CC Luer Lock	Syringes & Needles	SURGICAL	15	0	2026-11-06 12:06:00.935
cmw4xhnu5009q11ejmhoen3eg	Cannula 3-Way Stopcock	Standard Luer Lock Sterile	IV Cannulas	SURGICAL	15	0	2026-11-06 12:06:00.942
cmw4xhnub009t11eja203teip	IV Cannula	18 Gauge (Green) 1.3 x 45mm	IV Cannulas	SURGICAL	15	0	2026-11-06 12:06:00.947
cmw4xhnug009w11ejj8wrz85b	IV Cannula	20 Gauge (Pink) 1.1 x 32mm	IV Cannulas	SURGICAL	15	0	2026-11-06 12:06:00.952
cmw4xhnul009z11ejbxd913sj	IV Cannula	22 Gauge (Blue) 0.9 x 25mm	IV Cannulas	SURGICAL	15	0	2026-11-06 12:06:00.958
cmw4xhnux00a511ejgztxs4ph	Dextrose Water 5%	500ml IV Infusion Bottle	IV Infusions & Fluids	SURGICAL	15	0	2026-11-06 12:06:00.97
cmw4xhnv600a811ejj0z82j6r	Dextrose Water 5%	1000ml IV Infusion Bottle	IV Infusions & Fluids	SURGICAL	15	0	2026-11-06 12:06:00.978
cmw4xhnve00ab11ej3gvma48h	Normal Saline (NS 0.9%)	100ml Infusion Bottle	IV Infusions & Fluids	SURGICAL	15	0	2026-11-06 12:06:00.986
cmw4xhnvl00ae11ejdtcrxioj	Normal Saline (NS 0.9%)	500ml Infusion Bottle	IV Infusions & Fluids	SURGICAL	15	0	2026-11-06 12:06:00.994
cmw4xhnvs00ah11ejd1eqfoan	Normal Saline (NS 0.9%)	1000ml Infusion Bottle	IV Infusions & Fluids	SURGICAL	15	0	2026-11-06 12:06:01
cmw4xhnvz00ak11ejhlj9u8o6	Ringer's Lactate (RL)	500ml Infusion Bottle	IV Infusions & Fluids	SURGICAL	15	0	2026-11-06 12:06:01.007
cmw4xhnw800an11ejoyb0o6dp	Ringer's Lactate (RL)	1000ml Infusion Bottle	IV Infusions & Fluids	SURGICAL	15	0	2026-11-06 12:06:01.016
cmw4xhnwe00aq11ejc0hya004	Abdomen Sponge	30 x 30 cm 12-Ply X-Ray Detectable	Surgical Disposables	SURGICAL	15	0	2026-11-06 12:06:01.022
cmw4xhnwj00at11ej6ycpece0	Surgical Gauze	10 x 10 cm Sterile 8-Ply	Bandages & Dressings	SURGICAL	15	0	2026-11-06 12:06:01.028
cmw4xhnwo00aw11ejyzatuj6p	Baby Feeder	Infant Bottle 120ml BPA Free	Surgical Disposables	SURGICAL	15	0	2026-11-06 12:06:01.033
cmw4xhnwv00az11ej5xe3kjhb	Baby Suction Catheter	Size 6 Fr Thumb Control	Catheters & Drainage	SURGICAL	15	0	2026-11-06 12:06:01.039
cmw4xhnx200b211ejuu9dxzr6	Cord Clamp	Umbilical Cord Clamp Sterile	Surgical Disposables	SURGICAL	15	0	2026-11-06 12:06:01.046
cmw4xhnx800b511ejj64g0aoo	Diathermy Lead / Pencil	Monopolar / Bipolar Lead with Cable	Surgical Disposables	SURGICAL	15	0	2026-11-06 12:06:01.053
cmw4xhnxf00b811ejjukqo8a2	Foley Balloon Catheter	2-Way Silicone/Latex Size 16 Fr	Catheters & Drainage	SURGICAL	15	0	2026-11-06 12:06:01.059
cmw4xhnxm00bb11ejpquuym9h	Enema Syringe / Set	Kaleen Enema Pack 133ml	Syringes & Needles	SURGICAL	15	0	2026-11-06 12:06:01.067
cmw4xhnxs00be11ejic4anuiv	IV Infusion Set	Classic Gravity 20 Drops/ml	IV Infusions & Fluids	SURGICAL	15	0	2026-11-06 12:06:01.073
cmw4xhnxy00bh11ejhjzy8g44	IV Infusion Set	Y-Port Injection Site Needle-Free	Syringes & Needles	SURGICAL	15	0	2026-11-06 12:06:01.079
cmw4xhny300bk11ej8828jnni	Contraceptive Implant	Jadelle / Implanon Rod 2-Rod Subdermal	Surgical Disposables	SURGICAL	15	0	2026-11-06 12:06:01.084
cmw4xhny900bn11ej4klpg74n	Nelaton Drain Catheter	Size 16 Fr Straight PVC	Catheters & Drainage	SURGICAL	15	0	2026-11-06 12:06:01.09
cmw4xhnye00bq11ejoar1ii7b	Nasogastric (NG) Tube	Size 6 Fr Infant Feeding Tube	Surgical Disposables	SURGICAL	15	0	2026-11-06 12:06:01.094
cmw4xhnyj00bt11ejb79erurc	Ring Pessary	Size 2.5 / 2.7 Silicone Uterine Support	Surgical Disposables	SURGICAL	15	0	2026-11-06 12:06:01.1
cmw4xhnyq00bw11ej1w9ecfuk	Surgical Suture	Chromic Catgut Size 1 75cm Round Bodied 40mm	Sutures & Blades	SURGICAL	15	0	2026-11-06 12:06:01.106
cmw4xhnyw00bz11ej0l6jolg0	Surgical Suture	Chromic Catgut Size 2 75cm Heavy Reverse Cutting	Sutures & Blades	SURGICAL	15	0	2026-11-06 12:06:01.112
cmw4xhnz100c211ejrdu3lnuw	Surgical Suture	Silk Braided Size 1 Black 75cm	Sutures & Blades	SURGICAL	15	0	2026-11-06 12:06:01.117
cmw4xhnz700c511ejv2794r9w	Surgical Suture	Vicryl (Polyglactin) Size 1 Violet 90cm CT-1	Sutures & Blades	SURGICAL	15	0	2026-11-06 12:06:01.123
cmw4xhnzc00c811ejeh1u5bvz	Surgical Suture	Vicryl (Polyglactin) Size 2/0 70cm Taper Point	Sutures & Blades	SURGICAL	15	0	2026-11-06 12:06:01.128
cmw4xhnzg00cb11ejavzvcgzl	Surgical Suture	Wego Prolene (Polypropylene) Size 1 Blue 100cm	Sutures & Blades	SURGICAL	15	0	2026-11-06 12:06:01.133
cmw4xhnzm00ce11ej2wtqawor	Surgical Suture	Wego Prolene (Polypropylene) Size 2/0 90cm	Sutures & Blades	SURGICAL	15	0	2026-11-06 12:06:01.139
cmw4xhnzs00ch11ejf41w3awl	Skin Stapler	Sterile Disposable Stapler 35 Wide	Surgical Disposables	SURGICAL	15	0	2026-11-06 12:06:01.145
cmw4xho0000ck11ej4uwcx1w2	Spinal Needle	Lumbar Puncture 25G / 27G 90mm Quincke	Surgical Disposables	SURGICAL	15	0	2026-11-06 12:06:01.152
cmw4xho0d00cq11ej4smqddd4	Suction Yankauer / Tube	Size 28 Fr Crown Tip + 2.5m Tubing	Surgical Disposables	SURGICAL	15	0	2026-11-06 12:06:01.165
cmw4xho0i00ct11ejtlpa7veo	Surgical Scalpel Blade	Carbon/Stainless Blade No. 11 / 15	Sutures & Blades	SURGICAL	15	0	2026-11-06 12:06:01.17
cmw4xho0o00cw11ejvyrjh7kp	Surgical Gloves	Comfeel Size 6.5 Powder-Free Sterile Latex	Gloves & Protection	SURGICAL	15	0	2026-11-06 12:06:01.176
cmw4xho0u00cz11ejy9400wee	Surgical Gloves	Comfeel Size 7.0 Powder-Free Sterile Latex	Gloves & Protection	SURGICAL	15	0	2026-11-06 12:06:01.183
cmw4xho1100d211ejgnpx5qkg	Surgical Gloves	Comfeel Size 7.5 Powder-Free Sterile Latex	Gloves & Protection	SURGICAL	15	0	2026-11-06 12:06:01.189
cmw4xho1800d511ejal5kobgf	Urine Collection Drainage Bag	2000ml with Bottom Outlet T-Valve	Catheters & Drainage	SURGICAL	15	0	2026-11-06 12:06:01.196
cmw4xho1d00d811ejmkgdjczg	Abocal	Tab	Tab	MEDICINE	10	0	2026-11-06 12:06:01.202
cmw4xho1n00de11ejwhxjpvug	Acti Life	Sachet / Supplement	Sachets & Nutritional	MEDICINE	25	0	2026-11-06 12:06:01.211
cmw4xho1s00dh11ej7cz72rz9	Adaben	Cream / Gel	Creams & Ointments	MEDICINE	25	0	2026-11-06 12:06:01.217
cmw4xho1y00dk11ejs9pjuqpm	Adrenaline	Inj 1mg/ml	Injections & Ampoules	MEDICINE	25	0	2026-11-06 12:06:01.222
cmw4xho1i00db11ejfbkx1vi7	Acefyl	120ml	Syrups & Suspensions	MEDICINE	25	0	2026-11-06 12:06:01.206
cmw4xho2900dq11ejza3vrsmr	Alagel	Suspension	Syrups & Suspensions	MEDICINE	25	0	2026-11-06 12:06:01.234
cmw4xho2d00dt11eja2uf2xxz	Alapro	Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.238
cmw4xho2h00dw11ejc6dzfklx	Aldomet	250mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.242
cmw4xho2300dn11ejqdye179e	AG-VONO	Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.228
cmw4xhntt009k11ejtxgg2441	Syringe	5 CC with 22G Needle	Syringes & Needles	SURGICAL	15	0	2026-11-06 12:06:00.93
cmw4xho2w00e811ej8hon4yv7	Aquacal	Susp / Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.257
cmw4xho3400ee11ejnzzqbqpk	Atem	Inhaler / Solution	Syrups & Suspensions	MEDICINE	25	0	2026-11-06 12:06:01.265
cmw4xho3900eh11ejlda0domv	Atropine	Inj	Injections & Ampoules	MEDICINE	25	0	2026-11-06 12:06:01.269
cmw4xho3d00ek11ej0yosx0gx	Augmentin	156mg/5ml Susp	Syrups & Suspensions	MEDICINE	25	0	2026-11-06 12:06:01.273
cmw4xho3i00en11ejf2ptey4h	Augmentin	312mg/5ml Susp	Syrups & Suspensions	MEDICINE	25	0	2026-11-06 12:06:01.278
cmw4xho3m00eq11eje539c5f3	Augmentin	457mg BD Susp	Syrups & Suspensions	MEDICINE	25	0	2026-11-06 12:06:01.282
cmw4xho3q00et11ejg1md834i	Augmentin	625mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.287
cmw4xho3w00ew11ejrfx6n6d8	Augmentin	1000mg BD Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.292
cmw4xho4200ez11ejr8058j80	Awardin Plus	Cap	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.298
cmw4xho4600f211ejlwupjmh3	Azomax	250mg Tab / Cap	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.303
cmw4xho4d00f511ejmp7pvg4l	Azomax	500mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.309
cmw4xho4k00f811ejyykh4ugg	Azotek	250mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.316
cmw4xho4q00fb11ejjh8uazwl	BCG Vaccine	Standard Unit	General Medicines	MEDICINE	25	0	2026-11-06 12:06:01.322
cmw4xho4v00fe11ej3sxq0ear	Biofad	Cream	Creams & Ointments	MEDICINE	25	0	2026-11-06 12:06:01.327
cmw4xho5300fh11ejihydg1hw	Bisleri-S	Sachet / Solution	Syrups & Suspensions	MEDICINE	25	0	2026-11-06 12:06:01.336
cmw4xho5900fk11ejfs04r9s9	Bofalgan	1g IV Infusion	Injections & Ampoules	MEDICINE	25	0	2026-11-06 12:06:01.341
cmw4xho5f00fn11ej1foz81rx	BoneTab	Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.347
cmw4xho5k00fq11ej565z7o4i	Bovitarol	Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.352
cmw4xho5q00ft11ejy8087cwx	Breeky	Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.358
cmw4xho5w00fw11ejkbbsggrj	Brottin	2.5mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.365
cmw4xho6300fz11ejrnhrp57f	Brufen	120ml Susp	Syrups & Suspensions	MEDICINE	25	0	2026-11-06 12:06:01.371
cmw4xho6900g211ejmwiy983g	Bupican-SP	Inj (Spinal Heavy)	Injections & Ampoules	MEDICINE	25	0	2026-11-06 12:06:01.377
cmw4xho6d00g511ej5v2p8oto	CAC 1000 Plus	Effervescent Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.381
cmw4xho6h00g811ejgj5zhl1d	Caesafe	150mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.385
cmw4xho6l00gb11ejbccj7r53	Calamine	Lotion	Creams & Ointments	MEDICINE	25	0	2026-11-06 12:06:01.39
cmw4xho6q00ge11ej07o1mdxh	Calamox	1.2g Inj	Injections & Ampoules	MEDICINE	25	0	2026-11-06 12:06:01.394
cmw4xho6t00gh11ejh5b2ax9t	Calamox	625mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.397
cmw4xho6x00gk11ejed1kg85z	Calamox	1g Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.401
cmw4xho7200gn11ej2i16isgs	Calfina Plus	Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.406
cmw4xho7600gq11ej4mvqpajv	Campix	Inj	Injections & Ampoules	MEDICINE	25	0	2026-11-06 12:06:01.41
cmw4xho7900gt11ejv4sr4r17	Capoten	25mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.414
cmw4xho7h00gz11ej9cj7ok16	Cefiget	400mg Cap	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.421
cmw4xho7l00h211ej7vlmxeou	Cefim DS	Susp	Syrups & Suspensions	MEDICINE	25	0	2026-11-06 12:06:01.425
cmw4xho7o00h511ej308dzqfd	Ceremin	400mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.428
cmw4xho7s00h811ej7hktaz42	Ceremin	800mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.433
cmw4xho7x00hb11ejua2ds5ga	Ceremin	Inj	Injections & Ampoules	MEDICINE	25	0	2026-11-06 12:06:01.437
cmw4xho8200he11ejbc1l91tn	Ciproxin	250mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.442
cmw4xho8700hh11ejlwwq6ubf	Ciproxin	500mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.447
cmw4xho8c00hk11ejosdigbfc	Citralka	Liquid / Syrup	Syrups & Suspensions	MEDICINE	25	0	2026-11-06 12:06:01.452
cmw4xho8h00hn11ejc0t2nzsd	Clenil	Inhaler / Solution	Syrups & Suspensions	MEDICINE	25	0	2026-11-06 12:06:01.457
cmw4xho8l00hq11ej8fhsa668	Clindamax-V	Vaginal Cream / Suppository	Creams & Ointments	MEDICINE	25	0	2026-11-06 12:06:01.462
cmw4xho8p00ht11ejchyntlvl	Clomid	50mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.465
cmw4xho8u00hw11ej2s2kzyl7	Clycin V	Vaginal Cream	Creams & Ointments	MEDICINE	25	0	2026-11-06 12:06:01.47
cmw4xho9000hz11ej8uo6vz40	CMZ Neo	Susp / Drops	Syrups & Suspensions	MEDICINE	25	0	2026-11-06 12:06:01.476
cmw4xho9600i211ejlvrrath0	CMZ Plain	Susp / Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.482
cmw4xho9b00i511ejz84gqsil	CoEziday	Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.487
cmw4xho9g00i811ejco4hfio3	Coferb	Drops	Eye & Ear Drops	MEDICINE	25	0	2026-11-06 12:06:01.493
cmw4xho9m00ib11ej162755iu	Colic Drops	Drops	Eye & Ear Drops	MEDICINE	25	0	2026-11-06 12:06:01.498
cmw4xho9r00ie11ejvsx8kr3b	Colospas Fibro	Tab / Sachet	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.504
cmw4xho9v00ih11ej8kdmhmdg	Copete Classic	Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.508
cmw4xhoa100ik11eju0fpazka	Core 24	Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.513
cmw4xhoa600in11ej0nfql5wa	Core-C	Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.518
cmw4xhoab00iq11ej45yicjdf	Cran Fresh	Sachet	Sachets & Nutritional	MEDICINE	25	0	2026-11-06 12:06:01.524
cmw4xhoag00it11ejp5dpq46i	Cran Max	Sachet	Sachets & Nutritional	MEDICINE	25	0	2026-11-06 12:06:01.528
cmw4xhoak00iw11ejrkan1dc3	Cyclogest	400mg Pessaries	General Medicines	MEDICINE	25	0	2026-11-06 12:06:01.533
cmw4xhoaq00iz11ej7mkm7tro	Cyprodiol	Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.538
cmw4xhoau00j211ejtaoc79hy	Cytopan	50mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.543
cmw4xhoay00j511ejw8c05hqc	D-Wise Cranberry	Sachet	Sachets & Nutritional	MEDICINE	25	0	2026-11-06 12:06:01.546
cmw4xhob200j811ejx3a9bagt	Daflon	500mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.55
cmw4xhob700jb11ej1vl67dnl	Daine 35	Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.555
cmw4xho2p00e211ej67etbmco	Annvil	Inj / Syrup	Syrups & Suspensions	MEDICINE	25	0	2026-11-06 12:06:01.249
cmw4xhobo00jk11ejs3ctukfb	Decadron	Inj	Injections & Ampoules	MEDICINE	25	0	2026-11-06 12:06:01.572
cmw4xhobt00jn11ejte1kdjew	Decalc	Tab / Susp	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.577
cmw4xhobx00jq11ej7agza9vn	DELISH	400g Powder	Sachets & Nutritional	MEDICINE	25	0	2026-11-06 12:06:01.581
cmw4xhoc400jt11ejlsrziloc	Depili	Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.588
cmw4xhoc900jw11ejg8wmip7p	Dexamethasone	Inj	Injections & Ampoules	MEDICINE	25	0	2026-11-06 12:06:01.593
cmw4xhoce00jz11ejlz4mtg06	Dicloran	50mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.598
cmw4xhocj00k211ejk1oultnh	Dicloran Disperlet	50mg Dispersible Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.604
cmw4xhoco00k511ejggqv189n	Digas	Drops	Eye & Ear Drops	MEDICINE	25	0	2026-11-06 12:06:01.608
cmw4xhoct00k811ejfwf3ll92	Dijex MP	120ml Susp	Syrups & Suspensions	MEDICINE	25	0	2026-11-06 12:06:01.613
cmw4xhod000kb11ej09gmfpg5	Dormicum	5mg Inj / Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.62
cmw4xhod400ke11ej9rymutuo	Dsave	Tab / Sachet	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.625
cmw4xhod800kh11ej5au2tt8j	Dufert	10mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.628
cmw4xhodc00kk11ejeoea2qgq	Duphalac	Syrup	Syrups & Suspensions	MEDICINE	25	0	2026-11-06 12:06:01.632
cmw4xhodi00kn11ejq62mfp8w	Duphaston	10mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.638
cmw4xhodm00kq11ejdtwqruml	Dydrotab	10mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.643
cmw4xhodq00kt11ejdl4vef73	Dysen Fort	Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.646
cmw4xhodz00kz11ejqvj4i8c7	Ecomin	Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.655
cmw4xhoe300l211ej9psvu53t	EMA	2.5mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.659
cmw4xhoe600l511ejpgprtnry	Enflor	Sachet / Cap	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.663
cmw4xhoea00l811ejjwhb8lc9	Erythrocin	500mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.667
cmw4xhoef00lb11ejmr4ftfdt	ES Loprot	40mg Cap	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.671
cmw4xhoei00le11ejnhcejo44	Esowel	40mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.675
cmw4xhoem00lh11ej9d70cnhw	Evion	400mg Cap	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.679
cmw4xhoeq00lk11ejpx1wtnuf	Famila	Inj	Injections & Ampoules	MEDICINE	25	0	2026-11-06 12:06:01.683
cmw4xhoew00ln11ej16ldqwn1	Famila	Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.689
cmw4xhof100lq11ej27fk7mzn	Famot	20mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.693
cmw4xhof600lt11ej18ormqzz	Famot	40mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.699
cmw4xhofb00lw11ejawatbhsw	Fantizol	150mg Cap	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.704
cmw4xhofg00lz11ejqaqe82h8	Fefan	Tab / Cap	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.709
cmw4xhofm00m211ejm963qu5f	Fefolvit	Cap	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.714
cmw4xhofs00m511ejpuaj6pwy	Femiwin	120ml Susp	Syrups & Suspensions	MEDICINE	25	0	2026-11-06 12:06:01.72
cmw4xhofy00m811ejb4jdboaa	Fercari	Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.726
cmw4xhog400mb11ejgdguj3wf	Ferfer	Sachet / Drops	Sachets & Nutritional	MEDICINE	25	0	2026-11-06 12:06:01.733
cmw4xhogb00me11ejfvuseq1a	Ferfix-FA	Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.74
cmw4xhogf00mh11ejp5lfgdjp	Feroxyma	50mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.744
cmw4xhogk00mk11ejrt9zqu0h	Ferrous Sulphate	Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.748
cmw4xhogp00mn11ejjnrcym08	Ferti Plus	Sachet / Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.753
cmw4xhogt00mq11ejo6hnx9dj	Ferti-C	5000 IU Inj	Injections & Ampoules	MEDICINE	25	0	2026-11-06 12:06:01.758
cmw4xhogx00mt11ejkybwr19z	Ferti-M	150 IU Inj	Injections & Ampoules	MEDICINE	25	0	2026-11-06 12:06:01.762
cmw4xhoh100mw11ejm45eamb4	Fertomid	50mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.766
cmw4xhoh500mz11ejxlgbw1l3	Fervail	200mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.77
cmw4xhoha00n211ejns304f2h	Fibrozon	Sachet / Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.774
cmw4xhohf00n511ejqrfb3yhh	Fixinor	Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.779
cmw4xhohj00n811ejavrpfr13	Flygel	Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.783
cmw4xhohs00ne11ej8emg6r34	Folic Acid	5mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.793
cmw4xhohy00nh11ej6glir6hu	Fortis	Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.799
cmw4xhoi300nk11ejledhrduy	Frecys	Sachet	Sachets & Nutritional	MEDICINE	25	0	2026-11-06 12:06:01.803
cmw4xhoi700nn11ej1fbu628d	Fudich	Cream / Ointment	Creams & Ointments	MEDICINE	25	0	2026-11-06 12:06:01.807
cmw4xhoib00nq11ejkczjn2wg	Getryl	2mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.811
cmw4xhoie00nt11ejbtbh9alg	Getryl	4mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.815
cmw4xhoik00nw11ejcidi5g8e	Glandin E2	Vaginal Gel / Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.821
cmw4xhoir00nz11ejjrb9f1sl	Glucophage	500mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.827
cmw4xhoiw00o211ejsebsq78r	Glycerine	Liquid / Suppository	Syrups & Suspensions	MEDICINE	25	0	2026-11-06 12:06:01.832
cmw4xhoiz00o511ej5oik9j4n	Gravibinan	2mg Inj	Injections & Ampoules	MEDICINE	25	0	2026-11-06 12:06:01.836
cmw4xhoj300o811ej7l6cixfq	Gravinate	Tab / Inj	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.839
cmw4xhoj700ob11ejc7gmj8ok	GTN	Sublingual Tab / Spray	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.844
cmw4xhojb00oe11eji5y9j99v	Gynosporine	Vaginal Tab / Suppository	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.848
cmw4xhojf00oh11ej6inj7lpz	Gynostole	Cap / Sachet	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.852
cmw4xhojk00ok11ejnngn8a8u	Haemaccel	IV Infusion	Injections & Ampoules	MEDICINE	25	0	2026-11-06 12:06:01.856
cmw4xhojo00on11ejqbcqxrmw	Healet	Ointment	Creams & Ointments	MEDICINE	25	0	2026-11-06 12:06:01.861
cmw4xhojs00oq11ejy34imaui	HI-CAL D	Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.864
cmw4xhobi00jh11ejzsyncu30	Dayline	2g Inj	Injections & Ampoules	MEDICINE	25	0	2026-11-06 12:06:01.566
cmw4xhok400oz11ejnxza7vj3	Hydrocortisone	100mg Inj	Injections & Ampoules	MEDICINE	25	0	2026-11-06 12:06:01.876
cmw4xhok700p211ejq7m27uxv	Hydrozole	Cream	Creams & Ointments	MEDICINE	25	0	2026-11-06 12:06:01.88
cmw4xhokb00p511ej6ws6mdvi	Hydryllin	120ml Syrup	Syrups & Suspensions	MEDICINE	25	0	2026-11-06 12:06:01.884
cmw4xhokf00p811ej6hkxmaq4	Hydryllin DM	120ml Syrup	Syrups & Suspensions	MEDICINE	25	0	2026-11-06 12:06:01.887
cmw4xhokj00pb11ejbphisugk	Hyzonate	100mg Inj	Injections & Ampoules	MEDICINE	25	0	2026-11-06 12:06:01.891
cmw4xhokm00pe11ejmc9zjdth	Ibert Folic	500mcg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.895
cmw4xhokq00ph11ejfu5er7pu	Icon	100mg Cap	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.898
cmw4xhoku00pk11ejz4ehbfiq	Imatet	Tetanus Toxoid Inj	Injections & Ampoules	MEDICINE	25	0	2026-11-06 12:06:01.903
cmw4xhol000pn11ej9325tjh6	Inderal	10mg / 40mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.908
cmw4xhol400pq11ej92ms4ieh	Inventive	60ml Susp	Syrups & Suspensions	MEDICINE	25	0	2026-11-06 12:06:01.913
cmw4xhol800pt11ejfgabmrbz	Iraxin	Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.917
cmw4xholc00pw11ejexd6anbi	Irofast	Tab / Sachet	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.92
cmw4xholg00pz11ejs345lv1u	Iron One	Tab / Sachet	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.925
cmw4xholo00q511ejlelroafx	KCL Ampoule	(Potassium Chloride)	Injections & Ampoules	MEDICINE	25	0	2026-11-06 12:06:01.933
cmw4xholt00q811ejriwt0wr8	Kestine	10mg / 20mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.937
cmw4xholy00qb11ejrl8uqv1z	Ketamine	Inj	Injections & Ampoules	MEDICINE	25	0	2026-11-06 12:06:01.943
cmw4xhom200qe11ej00ybzw9y	Ketgo	Inj	Injections & Ampoules	MEDICINE	25	0	2026-11-06 12:06:01.946
cmw4xhom500qh11ejap0mqug8	Kipowel	30ml Drops / Susp	Syrups & Suspensions	MEDICINE	25	0	2026-11-06 12:06:01.95
cmw4xhom900qk11ejjs7cquz9	K-Lot	Inj (Phytomenadione/Tranexamic)	Injections & Ampoules	MEDICINE	25	0	2026-11-06 12:06:01.953
cmw4xhomd00qn11ej8jhyop2b	Labetalol	100mg Tab / Inj	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.957
cmw4xhomh00qq11ejrgbjq025	Lacto 1	220g Formula Milk	General Medicines	MEDICINE	25	0	2026-11-06 12:06:01.961
cmw4xhoml00qt11ej402gg89b	Lasix	20mg / 40mg Inj / Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.965
cmw4xhomp00qw11ej2p7taz3i	Laxoberon	Drops	Eye & Ear Drops	MEDICINE	25	0	2026-11-06 12:06:01.97
cmw4xhomu00qz11ej5rsxtxjb	Laxoberon	5mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.975
cmw4xhomy00r211ej15u8ewby	Lebreta	2.5mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.978
cmw4xhon200r511ejeryviylq	Lederplex	120ml Syrup	Syrups & Suspensions	MEDICINE	25	0	2026-11-06 12:06:01.983
cmw4xhon600r811ejfbawguho	Leflox	250mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.986
cmw4xhona00rb11ejmsolmgnm	Leflox	500mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.991
cmw4xhone00re11ejlv7pn3b0	Levo	500mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.995
cmw4xhonj00rh11ej7eckyfrx	Levofin	Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.999
cmw4xhono00rk11ejrvglx9cj	Liquid Paraffin	Liquid	Syrups & Suspensions	MEDICINE	25	0	2026-11-06 12:06:02.004
cmw4xhonu00rn11ejsna3bk2e	Locyst	Sachet	Sachets & Nutritional	MEDICINE	25	0	2026-11-06 12:06:02.011
cmw4xhoo100rq11ejsloz6jgf	Loprin	75mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.018
cmw4xhoo600rt11ejsbtzogpi	Loprin	150mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.023
cmw4xhoob00rw11eji77o128w	Lysovit	Syrup	Syrups & Suspensions	MEDICINE	25	0	2026-11-06 12:06:02.027
cmw4xhoog00rz11ej4puclugs	Macapex	Tab / Sachet	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.032
cmw4xhool00s211ejou4k0p10	Magnesium Sulphate	Inj / Solution	Syrups & Suspensions	MEDICINE	25	0	2026-11-06 12:06:02.037
cmw4xhoop00s511ejf2ookiwc	Mam 2B Sugar Free	Powder / Sachet	Sachets & Nutritional	MEDICINE	25	0	2026-11-06 12:06:02.041
cmw4xhoos00s811ejxeb8ofbo	Maxeed	Sachet	Sachets & Nutritional	MEDICINE	25	0	2026-11-06 12:06:02.045
cmw4xhoow00sb11ej6qismhcr	Maxolon	Inj	Injections & Ampoules	MEDICINE	25	0	2026-11-06 12:06:02.048
cmw4xhop000se11ejbezhcobr	Maxolon	Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.053
cmw4xhop400sh11ejj6s30vqx	Mebrotol	2.5mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.057
cmw4xhop800sk11ejwg63411u	Metofol	400mcg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.061
cmw4xhopc00sn11ejc0cl9gfv	Mom Folic Max	Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.065
cmw4xhoph00sq11ejzetfez98	Mosegor	60ml Syrup	Syrups & Suspensions	MEDICINE	25	0	2026-11-06 12:06:02.069
cmw4xhopl00st11ej89tdy7bu	Motilium	10mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.074
cmw4xhopr00sw11ej67j1rkfh	Multical	Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.079
cmw4xhopu00sz11ejmawz5le8	Mycitracin	Ointment	Creams & Ointments	MEDICINE	25	0	2026-11-06 12:06:02.083
cmw4xhopy00t211ejjpw0bt0l	Myojem Plus	Sachet	Sachets & Nutritional	MEDICINE	25	0	2026-11-06 12:06:02.087
cmw4xhoq300t511ejgabvy2vj	Neurobion	Tab / Inj	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.091
cmw4xhoq600t811ejwjqg315w	Nexum	40mg Tab / Cap	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.095
cmw4xhoq900tb11ejot862ecx	Nezkil	600mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.098
cmw4xhoqd00te11ej0l2mp0du	Nifedil	10mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.102
cmw4xhoql00tk11ejknu1nfvc	Nilstat	Drops	Eye & Ear Drops	MEDICINE	25	0	2026-11-06 12:06:02.109
cmw4xhoqo00tn11ejfm8fvalt	Nitrofast	Tab / Sachet	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.113
cmw4xhoqt00tq11ejc0qcpayb	Noregyn	5mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.118
cmw4xhoqy00tt11ejx7orevga	Nospa	40mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.122
cmw4xhor200tw11ejjmhjgt7k	Nospa Fort	80mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.127
cmw4xhor600tz11ejwbpbbcc7	Nalbuphine	Inj 10mg/ml	Injections & Ampoules	MEDICINE	25	0	2026-11-06 12:06:02.131
cmw4xhorb00u211ejyjggc4zj	Numil Stage 1	Formula	General Medicines	MEDICINE	25	0	2026-11-06 12:06:02.135
cmw4xhok000ow11ejghhi45hz	Hizone	1g Inj	Injections & Ampoules	MEDICINE	25	0	2026-11-06 12:06:01.872
cmw4xhorp00ub11ejfuj9z9er	ORS	Oral Rehydration Sachet	Sachets & Nutritional	MEDICINE	25	0	2026-11-06 12:06:02.15
cmw4xhort00ue11ej1jqmazli	Orslim	120mg Cap	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.153
cmw4xhorx00uh11eji0ergn17	Osam-D	Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.157
cmw4xhos200uk11ej8ehtokzk	Oslia	Sachet / Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.162
cmw4xhos600un11ej3eibgu07	Osso-D	Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.167
cmw4xhosb00uq11ejoaxz9van	Ottaso	40mg Cap	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.171
cmw4xhosf00ut11ejcmil0vcx	Ovarise	Sachet	Sachets & Nutritional	MEDICINE	25	0	2026-11-06 12:06:02.176
cmw4xhosk00uw11ejkjwysn5j	Oxidil	500mg Inj	Injections & Ampoules	MEDICINE	25	0	2026-11-06 12:06:02.181
cmw4xhoso00uz11ejj1dwxn0d	Oxidil	1g Inj	Injections & Ampoules	MEDICINE	25	0	2026-11-06 12:06:02.184
cmw4xhoss00v211ejpp2mllms	Oxidil	2g IV Infusion	Injections & Ampoules	MEDICINE	25	0	2026-11-06 12:06:02.188
cmw4xhosv00v511ejjfhqs7lh	Oxoferin	Solution	Syrups & Suspensions	MEDICINE	25	0	2026-11-06 12:06:02.192
cmw4xhot000v811ejcgz27aqr	Panadol	Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.196
cmw4xhot400vb11ejaj5vy2ss	Panadol	Drops	Eye & Ear Drops	MEDICINE	25	0	2026-11-06 12:06:02.201
cmw4xhot800ve11ej76lwsbgx	Panamin-G	500ml Infusion	Injections & Ampoules	MEDICINE	25	0	2026-11-06 12:06:02.204
cmw4xhotc00vh11ejrbettg0d	Paradox Omega	Cap	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.208
cmw4xhoti00vk11ej82rerfny	Pepsin	120ml Syrup	Syrups & Suspensions	MEDICINE	25	0	2026-11-06 12:06:02.214
cmw4xhotn00vn11ejpitcc006	Permen	Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.219
cmw4xhotv00vt11ejzjopiovu	Ponstan	250mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.228
cmw4xhotz00vw11ejez5tmiw8	Ponstan Forte	500mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.231
cmw4xhou400vz11ej4wd8rmhu	Pregnofer	Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.237
cmw4xhou800w211ej9rzhv51p	Primo	Tab / Sachet	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.241
cmw4xhouc00w511ejmxw2msml	Primolut-N	5mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.244
cmw4xhoug00w811ejnc2nxszv	Pregnancycare	Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.248
cmw4xhouk00wb11ejw4gmora6	Propofol 1%	Inj / Infusion	Injections & Ampoules	MEDICINE	25	0	2026-11-06 12:06:02.253
cmw4xhoup00we11ejsrqz2bz6	Prosotec	200mcg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.258
cmw4xhout00wh11ejnerv33nl	Pubergen	5000 IU Inj	Injections & Ampoules	MEDICINE	25	0	2026-11-06 12:06:02.261
cmw4xhouw00wk11ejqu5gzfo4	Qalsium D	Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.265
cmw4xhov100wn11ej40hutl1v	Qalsium D Mix	Sachet	Sachets & Nutritional	MEDICINE	25	0	2026-11-06 12:06:02.269
cmw4xhov400wq11ejk9a0x92y	Q-Bact	1g Inj	Injections & Ampoules	MEDICINE	25	0	2026-11-06 12:06:02.273
cmw4xhova00wt11ejl52gsm89	Q-Bact	2g Inj	Injections & Ampoules	MEDICINE	25	0	2026-11-06 12:06:02.278
cmw4xhove00ww11ej5ojydik7	Qick-D	Tab / Drops	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.282
cmw4xhovi00wz11ejqh6u8317	Q-Line	Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.286
cmw4xhovl00x211ejtxkiyceg	Reltus DM	120ml Syrup	Syrups & Suspensions	MEDICINE	25	0	2026-11-06 12:06:02.29
cmw4xhovp00x511ej9uf470im	RG Vit F	Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.293
cmw4xhovt00x811ejhxykim4p	Rhizofem	40mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.297
cmw4xhovx00xb11ej2c2onzz0	Risek Insta	20mg / 40mg Sachet	Sachets & Nutritional	MEDICINE	25	0	2026-11-06 12:06:02.301
cmw4xhow000xe11ej0dl5w6r5	Rocid-E	Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.305
cmw4xhow400xh11ej3b9p03i4	Rulling	40mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.309
cmw4xhow800xk11ej2najntsk	Sangobion	Cap	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.313
cmw4xhowc00xn11ejoto21ze8	Scabo	Lotion / Cream	Creams & Ointments	MEDICINE	25	0	2026-11-06 12:06:02.316
cmw4xhowg00xq11ej9hupp217	Sebesta	Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.32
cmw4xhowj00xt11ejrpoqbn0c	Sergifex	1g Inj	Injections & Ampoules	MEDICINE	25	0	2026-11-06 12:06:02.324
cmw4xhows00xz11ejf5pu1j46	Skilax	30ml Drops	Eye & Ear Drops	MEDICINE	25	0	2026-11-06 12:06:02.332
cmw4xhowx00y211eju81g2vk3	Softin	10mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.337
cmw4xhox100y511ejzaznkvic	Sofvasc	5mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.342
cmw4xhox600y811ej6a40utk2	Sofvasc	10mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.346
cmw4xhoxb00yb11ejsmi3shda	Spasfon	Tab / Inj	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.352
cmw4xhoxf00ye11ej6j8b4jfk	Spasler Neo	Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.356
cmw4xhoxj00yh11ej57w6khb3	Spasler-P	Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.359
cmw4xhoxm00yk11ejpsmwb22i	Stemetil	5mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.363
cmw4xhoxq00yn11ejysyxtueu	Sulzone	1g Inj	Injections & Ampoules	MEDICINE	25	0	2026-11-06 12:06:02.367
cmw4xhoxu00yq11ej9cwt2clr	Sunvit Vitamin D3	Tab / Drops	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.37
cmw4xhoxx00yt11ej6dzytnjz	Supravit	Syrup / Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.374
cmw4xhoy100yw11eja8i2iwpc	Syneflex	Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.377
cmw4xhoy500yz11ejqbgt7b3a	Syntocinon (Synto)	Inj 5 IU / 10 IU	Injections & Ampoules	MEDICINE	25	0	2026-11-06 12:06:02.382
cmw4xhoyb00z211ejsqy85ju8	Thyroxin	50mcg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.387
cmw4xhoye00z511ejl8c2kjpx	Toradol	Inj 30mg/ml	Injections & Ampoules	MEDICINE	25	0	2026-11-06 12:06:02.391
cmw4xhoyk00z811ejo524l4i6	Transamin	500mg Cap	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.396
cmw4xhoyo00zb11ejjksvlpnj	Transamin	500mg Inj	Injections & Ampoules	MEDICINE	25	0	2026-11-06 12:06:02.4
cmw4xhoyr00ze11ejpp75rw2t	Traxart	650mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.404
cmw4xhoyv00zh11ej3yytwobk	Trichogen	Tab / Solution	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.408
cmw4xhorl00u811ejqhzmn9gl	One Natal	Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.145
cmw4xhozm010211ejw528fcaq	Vepev	20mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.434
cmw4xhozp010511ejifwzi62e	Vermox	100mg Tab / Susp	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.438
cmw4xhozt010811ej80fomcmp	Voltral Emulgel 1%	Gel	Creams & Ointments	MEDICINE	25	0	2026-11-06 12:06:02.442
cmw4xhozx010b11ej1rgkxi7b	Voltral Emulgel 2% Forte	Gel	Creams & Ointments	MEDICINE	25	0	2026-11-06 12:06:02.445
cmw4xhp00010e11ejhp35x7di	Voren SR	100mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.449
cmw4xhp04010h11ejc25m5pco	Xoderon	8mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.453
cmw4xhntj009h11ejougfdsds	Syringe	3 CC with 23G Needle	Syringes & Needles	SURGICAL	15	0	2026-11-06 12:06:00.919
cmw4xhnuq00a211ej4lrcmt8g	IV Cannula	24 Gauge (Yellow) Paediatric 0.7 x 19mm	IV Cannulas	SURGICAL	15	0	2026-11-06 12:06:00.962
cmw4xho0600cn11ejvk8hgx1k	Spongostan / Spongestone	Absorbable Haemostatic Gelatin Sponge 7 x 5 x 1 cm	Surgical Disposables	SURGICAL	15	0	2026-11-06 12:06:01.159
cmw4xho2l00dz11ejyb61dm6k	Aminovil	600ml Infusion	Injections & Ampoules	MEDICINE	25	0	2026-11-06 12:06:01.246
cmw4xho2t00e511ejva58nf59	Ansaid	100mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.253
cmw4xho3000eb11ejml3cfvd2	Askorbin	Sachet	Sachets & Nutritional	MEDICINE	25	0	2026-11-06 12:06:01.261
cmw4xho7d00gw11ej35q5oupm	Capoten	50mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.417
cmw4xhobb00je11ejjn0v91na	Danzen DS	Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.56
cmw4xhodu00kw11ejxfsg565j	Dystrone	10mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.651
cmw4xhohn00nb11ej2wziopcm	Flygel	500mg/100ml IV Infusion	Injections & Ampoules	MEDICINE	25	0	2026-11-06 12:06:01.787
cmw4xhojw00ot11ej24s15pkl	HI-Vit 27	Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:01.869
cmw4xholk00q211ej8gip79om	Irose IV	100mg Iron Sucrose Infusion	Injections & Ampoules	MEDICINE	25	0	2026-11-06 12:06:01.929
cmw4xhoqh00th11ejs395n00d	Nifedil XL	30mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.106
cmw4xhorg00u511ejxpgf5ixc	Obsical	Sachet	Sachets & Nutritional	MEDICINE	25	0	2026-11-06 12:06:02.141
cmw4xhotr00vq11ejtgt7qftn	Polygynax	Vaginal Cap	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.223
cmw4xhown00xw11ejslld9w53	SG Indrop D	Oral Ampoule / Inj	Injections & Ampoules	MEDICINE	25	0	2026-11-06 12:06:02.328
cmw4xhoyz00zk11ejgzv2bcvx	Trisave	500mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.411
cmw4xhoz300zn11ejqos61ahq	Tynoseed	Gel	Creams & Ointments	MEDICINE	25	0	2026-11-06 12:06:02.415
cmw4xhoz700zq11ejwx3rqhb6	Ubkino	8mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.42
cmw4xhozb00zt11ej210rc0vi	Uresol	Sachet	Sachets & Nutritional	MEDICINE	25	0	2026-11-06 12:06:02.423
cmw4xhozf00zw11ej7iat0wk9	Urso	250mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.427
cmw4xhozi00zz11ejsoschc43	Velosef	500mg Cap	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.431
cmw4xhp08010k11ejsy4b3s5h	Xyloaid	2% Inj	Injections & Ampoules	MEDICINE	25	0	2026-11-06 12:06:02.457
cmw4xhp0c010n11ejey6z3bkg	Xyloaid	2% Jelly	General Medicines	MEDICINE	25	0	2026-11-06 12:06:02.461
cmw4xhp0g010q11ejnfwc0s4e	YAZ	Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.465
cmw4xhp0k010t11ej6nwyx3zb	Zeegap	50mg Cap	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.469
cmw4xhp0o010w11ejiutcv5j8	Zetro	50mg / 250mg Susp / Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.473
cmw4xhp0s010z11ejqoct5mzs	Zinacef	250mg Inj	Injections & Ampoules	MEDICINE	25	0	2026-11-06 12:06:02.477
cmw4xhp0x011211ejnyi4aik3	Zofran	8mg Tab / Inj	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.481
cmw4xhp10011511ejqvtmp27t	Zoldap	600mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.485
cmw4xhp15011811ejno58hvf0	Zyto	250mg Tab	Tablets & Capsules	MEDICINE	25	0	2026-11-06 12:06:02.49
\.


--
-- Data for Name: MedicineInventory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MedicineInventory" (id, "sNo", "itemName", "formPotencySpec", "pkgPacks", "nosPerPack", "totalCost", "perUnitCost", "perPackCost", "totalValue", "perUnitSelling", "qtyPurchased", threshold, "perOff", "batchNo", "expiryDate", "isCredit", "createdAt", "updatedAt") FROM stdin;
cmw4y36f4001irnoc9d263di7	3	Acti Life	Sachet / Supplement	10	10	6390	63.9	639	8307	83.07	100	10	0	ACTI-26003	2027-10-28 00:00:00	t	2026-11-06 12:22:44.8	2026-11-06 12:22:44.8
cmw4y36f4001jrnoc34jdfwas	4	Adaben	Cream / Gel	15	1	3360	224	224	4368	291.2	15	10	0	ADAB-26004	2028-01-28 00:00:00	f	2026-11-06 12:22:44.8	2026-11-06 12:22:44.8
cmw4y36f4001krnocstsmv9au	5	Adrenaline	Inj 1mg/ml	10	5	4450	89	445	6007.5	120.15	50	10	0	ADRE-26005	2029-04-28 00:00:00	f	2026-11-06 12:22:44.8	2026-11-06 12:22:44.8
cmw4y36f4001mrnoco4zs64hq	7	Alagel	Suspension	20	1	3380	169	169	4326.4	216.32	20	10	0	ALAG-26007	2028-10-28 00:00:00	f	2026-11-06 12:22:44.8	2026-11-06 12:22:44.8
cmw4y36f4001nrnocdt8t671n	8	Alapro	Tab	10	30	4200	14	420	5670	18.9	300	10	0	ALAP-26008	2029-01-28 00:00:00	f	2026-11-06 12:22:44.8	2026-11-06 12:22:44.8
cmw4y36f4001ornocihepsoek	9	Aldomet	250mg Tab	10	30	4350	14.5	435	5874	19.58	300	10	0	ALDO-26009	2027-04-28 00:00:00	t	2026-11-06 12:22:44.8	2026-11-06 12:22:44.8
cmw4y36f4001prnocxtnpsd12	10	Aminovil	600ml Infusion	10	5	5400	108	540	7290	145.8	50	10	0	AMIN-26010	2028-07-28 00:00:00	f	2026-11-06 12:22:44.8	2026-11-06 12:22:44.8
cmw4y36f4001qrnoc0xcyghiw	11	Annvil	Inj / Syrup	20	1	3940	197	197	5043.2	252.16	20	10	0	ANNV-26011	2029-10-28 00:00:00	f	2026-11-06 12:22:44.8	2026-11-06 12:22:44.8
cmw4y36f4001rrnocpu7w2bvm	12	Ansaid	100mg Tab	10	30	4800	16	480	6480	21.6	300	10	0	ANSA-26012	2027-01-28 00:00:00	t	2026-11-06 12:22:44.8	2026-11-06 12:22:44.8
cmw4y36f4001srnoc822xzacm	13	Aquacal	Susp / Tab	20	1	4220	211	211	5401.6	270.08	20	10	0	AQUA-26013	2028-04-28 00:00:00	f	2026-11-06 12:22:44.8	2026-11-06 12:22:44.8
cmw4y36f4001trnocbmsg6now	14	Askorbin	Sachet	10	10	7820	78.2	782	10166	101.66	100	10	0	ASKO-26014	2029-07-28 00:00:00	f	2026-11-06 12:22:44.8	2026-11-06 12:22:44.8
cmw4y36f4001urnocxsdbhz8a	15	Atem	Inhaler / Solution	5	1	5525	1105	1105	6906.25	1381.25	5	10	0	ATEM-26015	2027-10-28 00:00:00	t	2026-11-06 12:22:44.8	2026-11-06 12:22:44.8
cmw4y36f4001vrnocqk4rnfg2	16	Atropine	Inj	10	5	6540	130.8	654	8829	176.58	50	10	0	ATRO-26016	2028-01-28 00:00:00	f	2026-11-06 12:22:44.8	2026-11-06 12:22:44.8
cmw4y36f4001wrnocikuy4c46	17	Augmentin	156mg/5ml Susp	20	1	4780	239	239	6118.4	305.92	20	10	0	AUGM-26017	2029-04-28 00:00:00	f	2026-11-06 12:22:44.8	2026-11-06 12:22:44.8
cmw4y36f4001xrnoc8fhf5lke	18	Augmentin	312mg/5ml Susp	20	1	4920	246	246	6297.6	314.88	20	10	0	AUGM-26018	2027-07-28 00:00:00	t	2026-11-06 12:22:44.8	2026-11-06 12:22:44.8
cmw4y36f4001yrnocohp1fe7b	19	Augmentin	457mg BD Susp	20	1	5060	253	253	6476.8	323.84	20	10	0	AUGM-26019	2028-10-28 00:00:00	f	2026-11-06 12:22:44.8	2026-11-06 12:22:44.8
cmw4y36f4001zrnoch2w4wp51	20	Augmentin	625mg Tab	10	30	6000	20	600	8100	27	300	10	0	AUGM-26020	2029-01-28 00:00:00	f	2026-11-06 12:22:44.8	2026-11-06 12:22:44.8
cmw4y36f40020rnoc4q9hizg0	21	Augmentin	1000mg BD Tab	10	30	6150	20.5	615	8304	27.68	300	10	0	AUGM-26021	2027-04-28 00:00:00	t	2026-11-06 12:22:44.8	2026-11-06 12:22:44.8
cmw4y36f40021rnocmct50cgl	22	Awardin Plus	Cap	10	30	6300	21	630	8505	28.35	300	10	0	AWAR-26022	2028-07-28 00:00:00	f	2026-11-06 12:22:44.8	2026-11-06 12:22:44.8
cmw4y36f40022rnocz6tduuf9	23	Azomax	250mg Tab / Cap	10	30	6450	21.5	645	8709	29.03	300	10	0	AZOM-26023	2029-10-28 00:00:00	f	2026-11-06 12:22:44.8	2026-11-06 12:22:44.8
cmw4y36f40023rnoc6qlrp92t	24	Azomax	500mg Tab	10	30	6600	22	660	8910	29.7	300	10	0	AZOM-26024	2027-01-28 00:00:00	t	2026-11-06 12:22:44.8	2026-11-06 12:22:44.8
cmw4y36f40024rnocz70dn0td	25	Azotek	250mg Tab	10	30	6750	22.5	675	9114	30.38	300	10	0	AZOT-26025	2028-04-28 00:00:00	f	2026-11-06 12:22:44.8	2026-11-06 12:22:44.8
cmw4y36f40025rnoclcaa8nod	26	BCG Vaccine	Standard Unit	10	30	6900	23	690	9315	31.05	300	10	0	BCGV-26026	2029-07-28 00:00:00	f	2026-11-06 12:22:44.8	2026-11-06 12:22:44.8
cmw4y36f40026rnocb0tgwkbg	27	Biofad	Cream	15	1	3855	257	257	5011.5	334.1	15	10	0	BIOF-26027	2027-10-28 00:00:00	t	2026-11-06 12:22:44.8	2026-11-06 12:22:44.8
cmw4y36f40027rnockyjrrupn	28	Bisleri-S	Sachet / Solution	10	10	9640	96.4	964	12532	125.32	100	10	0	BISL-26028	2028-01-28 00:00:00	f	2026-11-06 12:22:44.8	2026-11-06 12:22:44.8
cmw4y36f40028rnocp8i1ekqm	29	Bofalgan	1g IV Infusion	10	5	9010	180.2	901	12163.5	243.27	50	10	0	BOFA-26029	2029-04-28 00:00:00	f	2026-11-06 12:22:44.8	2026-11-06 12:22:44.8
cmw4y36f50029rnoc8ozw4pss	30	BoneTab	Tab	10	30	7500	25	750	10125	33.75	300	10	0	BONE-26030	2027-07-28 00:00:00	t	2026-11-06 12:22:44.8	2026-11-06 12:22:44.8
cmw4y36f5002arnoc3f84b5l1	31	Bovitarol	Tab	10	30	7650	25.5	765	10329	34.43	300	10	0	BOVI-26031	2028-10-28 00:00:00	f	2026-11-06 12:22:44.8	2026-11-06 12:22:44.8
cmw4y36f5002brnocuozldnfn	32	Breeky	Tab	10	30	7800	26	780	10530	35.1	300	10	0	BREE-26032	2029-01-28 00:00:00	f	2026-11-06 12:22:44.8	2026-11-06 12:22:44.8
cmw4y36f5002crnocd9ra0b2f	33	Brottin	2.5mg Tab	10	30	7950	26.5	795	10734	35.78	300	10	0	BROT-26033	2027-04-28 00:00:00	t	2026-11-06 12:22:44.8	2026-11-06 12:22:44.8
cmw4y36f5002drnoc7g1y1l4u	34	Brufen	120ml Susp	20	1	3560	178	178	4556.8	227.84	20	10	0	BRUF-26034	2028-07-28 00:00:00	f	2026-11-06 12:22:44.8	2026-11-06 12:22:44.8
cmw4y36f5002ernocx5sxojxu	35	Bupican-SP	Inj (Spinal Heavy)	10	5	10150	203	1015	13702.5	274.05	50	10	0	BUPI-26035	2029-10-28 00:00:00	f	2026-11-06 12:22:44.8	2026-11-06 12:22:44.8
cmw4y36f5002frnock3prcdaf	36	CAC 1000 Plus	Effervescent Tab	10	30	8400	28	840	11340	37.8	300	10	0	CAC1-26036	2027-01-28 00:00:00	t	2026-11-06 12:22:44.8	2026-11-06 12:22:44.8
cmw4y36f5002grnocppsvsdcz	37	Caesafe	150mg Tab	10	30	8550	28.5	855	11544	38.48	300	10	0	CAES-26037	2028-04-28 00:00:00	f	2026-11-06 12:22:44.8	2026-11-06 12:22:44.8
cmw4y36f5002hrnocpjfnqkeq	38	Calamine	Lotion	20	1	4120	206	206	5273.6	263.68	20	10	0	CALA-26038	2029-07-28 00:00:00	f	2026-11-06 12:22:44.8	2026-11-06 12:22:44.8
cmw4y36f5002irnoc2d4h9jfa	39	Calamox	1.2g Inj	10	5	10910	218.2	1091	14728.5	294.57	50	10	0	CALA-26039	2027-10-28 00:00:00	t	2026-11-06 12:22:44.8	2026-11-06 12:22:44.8
cmw4y36f5002jrnoctbbv2kkj	40	Calamox	625mg Tab	10	30	9000	30	900	12150	40.5	300	10	0	CALA-26040	2028-01-28 00:00:00	f	2026-11-06 12:22:44.8	2026-11-06 12:22:44.8
cmw4y36f5002krnoc6zpnzm50	41	Calamox	1g Tab	10	30	9150	30.5	915	12354	41.18	300	10	0	CALA-26041	2029-04-28 00:00:00	f	2026-11-06 12:22:44.8	2026-11-06 12:22:44.8
cmw4y36f4001hrnocpnf3fn32	2	Acefyl	120ml	20	1	2680	134	134	3430.4	171	900	25	0	ACEF-26002	2029-07-28 00:00:00	f	2026-11-06 12:22:44.8	2026-11-18 06:14:17.063
cmw4y36f4001grnocsfk2t17x	1	Abocal	Tab	10	30	3146850	3150	3150	1416582	1418	999	10	0	ABOC-26001	2028-04-28 00:00:00	f	2026-11-06 12:22:44.8	2026-11-18 06:28:44.798
cmw4y36f5002lrnochk76f41q	42	Calfina Plus	Tab	10	30	9300	31	930	12555	41.85	300	10	0	CALF-26042	2027-07-28 00:00:00	t	2026-11-06 12:22:44.8	2026-11-06 12:22:44.8
cmw4y36f5002mrnoc4ew6ozma	43	Campix	Inj	10	5	3670	73.4	367	4954.5	99.09	50	10	0	CAMP-26043	2028-10-28 00:00:00	f	2026-11-06 12:22:44.8	2026-11-06 12:22:44.8
cmw4y36f5002nrnocd2clg2ox	44	Capoten	25mg Tab	10	30	3100	10.33	310	4185	13.95	300	10	0	CAPO-26044	2029-01-28 00:00:00	f	2026-11-06 12:22:44.8	2026-11-06 12:22:44.8
cmw4y36f5002ornocxynx08wo	45	Capoten	50mg Tab	10	30	3250	10.83	325	4389	14.63	300	10	0	CAPO-26045	2027-04-28 00:00:00	t	2026-11-06 12:22:44.8	2026-11-06 12:22:44.8
cmw4y36f5002prnocvc98z229	46	Cefiget	400mg Cap	10	30	3400	11.33	340	4590	15.3	300	10	0	CEFI-26046	2028-07-28 00:00:00	f	2026-11-06 12:22:44.8	2026-11-06 12:22:44.8
cmw4y36f5002qrnocwp3hikcr	47	Cefim DS	Susp	20	1	5380	269	269	6886.4	344.32	20	10	0	CEFI-26047	2029-10-28 00:00:00	f	2026-11-06 12:22:44.8	2026-11-06 12:22:44.8
cmw4y36f5002rrnocbypswjiz	48	Ceremin	400mg Tab	10	30	3700	12.33	370	4995	16.65	300	10	0	CERE-26048	2027-01-28 00:00:00	t	2026-11-06 12:22:44.8	2026-11-06 12:22:44.8
cmw4y36f5002srnocsv80x4zu	49	Ceremin	800mg Tab	10	30	3850	12.83	385	5199	17.33	300	10	0	CERE-26049	2028-04-28 00:00:00	f	2026-11-06 12:22:44.8	2026-11-06 12:22:44.8
cmw4y36f5002trnoccp4l2ubo	50	Ceremin	Inj	10	5	5000	100	500	6750	135	50	10	0	CERE-26050	2029-07-28 00:00:00	f	2026-11-06 12:22:44.8	2026-11-06 12:22:44.8
cmw4y36fe002urnocux7i7je5	51	Ciproxin	250mg Tab	10	30	4150	13.83	415	5604	18.68	300	10	0	CIPR-26051	2027-10-28 00:00:00	t	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36fe002vrnochf3x9ac5	52	Ciproxin	500mg Tab	10	30	4300	14.33	430	5805	19.35	300	10	0	CIPR-26052	2028-01-28 00:00:00	f	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36fe002wrnocc8utsdlu	53	Citralka	Liquid / Syrup	20	1	2620	131	131	3353.6	167.68	20	10	0	CITR-26053	2029-04-28 00:00:00	f	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36fe002xrnochih3ghoq	54	Clenil	Inhaler / Solution	5	1	6340	1268	1268	7925	1585	5	10	0	CLEN-26054	2027-07-28 00:00:00	t	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36fe002yrnocrsib2s5e	55	Clindamax-V	Vaginal Cream / Suppository	15	1	5175	345	345	6727.5	448.5	15	10	0	CLIN-26055	2028-10-28 00:00:00	f	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36fe002zrnoc9e30k0g7	56	Clomid	50mg Tab	10	30	4900	16.33	490	6615	22.05	300	10	0	CLOM-26056	2029-01-28 00:00:00	f	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36fe0030rnoc3rfryteg	57	Clycin V	Vaginal Cream	15	1	5505	367	367	7156.5	477.1	15	10	0	CLYC-26057	2027-04-28 00:00:00	t	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36fe0031rnocbklh7ci7	58	CMZ Neo	Susp / Drops	20	1	3320	166	166	4249.6	212.48	20	10	0	CMZN-26058	2028-07-28 00:00:00	f	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36fe0032rnoc8p4k7f51	59	CMZ Plain	Susp / Tab	20	1	3460	173	173	4428.8	221.44	20	10	0	CMZP-26059	2029-10-28 00:00:00	f	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36fe0033rnoc8u9agi1v	60	CoEziday	Tab	10	30	5500	18.33	550	7425	24.75	300	10	0	COEZ-26060	2027-01-28 00:00:00	t	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36fe0034rnocch8qq5aq	61	Coferb	Drops	20	1	3740	187	187	4787.2	239.36	20	10	0	COFE-26061	2028-04-28 00:00:00	f	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36fe0035rnoc983g3w9b	62	Colic Drops	Drops	20	1	3880	194	194	4966.4	248.32	20	10	0	COLI-26062	2029-07-28 00:00:00	f	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36fe0036rnoc7ub9243n	63	Colospas Fibro	Tab / Sachet	10	10	6190	61.9	619	8047	80.47	100	10	0	COLO-26063	2027-10-28 00:00:00	t	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36fe0037rnoc5kh72mib	64	Copete Classic	Tab	10	30	6100	20.33	610	8235	27.45	300	10	0	COPE-26064	2028-01-28 00:00:00	f	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36fe0038rnocd5calnhl	65	Core 24	Tab	10	30	6250	20.83	625	8439	28.13	300	10	0	CORE-26065	2029-04-28 00:00:00	f	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36fe0039rnocxzjn9yt0	66	Core-C	Tab	10	30	6400	21.33	640	8640	28.8	300	10	0	CORE-26066	2027-07-28 00:00:00	t	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36fe003arnocpy4hdn8c	67	Cran Fresh	Sachet	10	10	6710	67.1	671	8723	87.23	100	10	0	CRAN-26067	2028-10-28 00:00:00	f	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36fe003brnocjvgs2jp5	68	Cran Max	Sachet	10	10	6840	68.4	684	8892	88.92	100	10	0	CRAN-26068	2029-01-28 00:00:00	f	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36fe003crnoc7rvzfqz8	69	Cyclogest	400mg Pessaries	10	30	6850	22.83	685	9246	30.82	300	10	0	CYCL-26069	2027-04-28 00:00:00	t	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36fe003drnoc1e7aqji8	70	Cyprodiol	Tab	10	30	7000	23.33	700	9450	31.5	300	10	0	CYPR-26070	2028-07-28 00:00:00	f	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36fe003ernoc4371f5hc	71	Cytopan	50mg Tab	10	30	7150	23.83	715	9651	32.17	300	10	0	CYTO-26071	2029-10-28 00:00:00	f	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36fe003frnocafofmfcj	72	D-Wise Cranberry	Sachet	10	10	7360	73.6	736	9568	95.68	100	10	0	DWIS-26072	2027-01-28 00:00:00	t	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36fe003grnocy11d0c5o	73	Daflon	500mg Tab	10	30	7450	24.83	745	10056	33.52	300	10	0	DAFL-26073	2028-04-28 00:00:00	f	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36fe003hrnocetaaafy2	74	Daine 35	Tab	10	30	7600	25.33	760	10260	34.2	300	10	0	DAIN-26074	2029-07-28 00:00:00	f	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36fe003irnocgrje5rla	75	Danzen DS	Tab	10	30	7750	25.83	775	10464	34.88	300	10	0	DANZ-26075	2027-10-28 00:00:00	t	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36fe003jrnocwg26e5ih	76	Dayline	2g Inj	10	5	9940	198.8	994	13419	268.38	50	10	0	DAYL-26076	2028-01-28 00:00:00	f	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36fe003krnoctgarrp45	77	Decadron	Inj	10	5	10130	202.6	1013	13675.5	273.51	50	10	0	DECA-26077	2029-04-28 00:00:00	f	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36fe003lrnoc1h3edeib	78	Decalc	Tab / Susp	20	1	2520	126	126	3225.6	161.28	20	10	0	DECA-26078	2027-07-28 00:00:00	t	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36ff003mrnocxn4mu784	79	DELISH	400g Powder	10	10	8270	82.7	827	10751	107.51	100	10	0	DELI-26079	2028-10-28 00:00:00	f	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36ff003nrnoc3yclzc5e	80	Depili	Tab	10	30	8500	28.33	850	11475	38.25	300	10	0	DEPI-26080	2029-01-28 00:00:00	f	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36ff003ornocblpcew52	81	Dexamethasone	Inj	10	5	10890	217.8	1089	14701.5	294.03	50	10	0	DEXA-26081	2027-04-28 00:00:00	t	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36ff003prnocfpqgbf4j	82	Dicloran	50mg Tab	10	30	8800	29.33	880	11880	39.6	300	10	0	DICL-26082	2028-07-28 00:00:00	f	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36ff003qrnocf8w2lq03	83	Dicloran Disperlet	50mg Dispersible Tab	10	30	8950	29.83	895	12081	40.27	300	10	0	DICL-26083	2029-10-28 00:00:00	f	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36ff003rrnochoh9fqfo	84	Digas	Drops	20	1	3360	168	168	4300.8	215.04	20	10	0	DIGA-26084	2027-01-28 00:00:00	t	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36ff003srnociheoe7k5	85	Dijex MP	120ml Susp	20	1	3500	175	175	4480	224	20	10	0	DIJE-26085	2028-04-28 00:00:00	f	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36ff003trnochjea2brg	86	Dormicum	5mg Inj / Tab	10	5	3840	76.8	384	5184	103.68	50	10	0	DORM-26086	2029-07-28 00:00:00	f	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36ff003urnocag4h75el	87	Dsave	Tab / Sachet	10	10	9310	93.1	931	12103	121.03	100	10	0	DSAV-26087	2027-10-28 00:00:00	t	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36ff003vrnoci21g7jim	88	Dufert	10mg Tab	10	30	3200	10.67	320	4320	14.4	300	10	0	DUFE-26088	2028-01-28 00:00:00	f	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36ff003wrnoco6nmj87i	89	Duphalac	Syrup	20	1	4060	203	203	5196.8	259.84	20	10	0	DUPH-26089	2029-04-28 00:00:00	f	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36ff003xrnocrjynqzwh	90	Duphaston	10mg Tab	10	30	3500	11.67	350	4725	15.75	300	10	0	DUPH-26090	2027-07-28 00:00:00	t	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36ff003yrnoc47gvonk5	91	Dydrotab	10mg Tab	10	30	3650	12.17	365	4929	16.43	300	10	0	DYDR-26091	2028-10-28 00:00:00	f	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36ff003zrnocavzo1wcq	92	Dysen Fort	Tab	10	30	3800	12.67	380	5130	17.1	300	10	0	DYSE-26092	2029-01-28 00:00:00	f	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36ff0040rnoc969blk5d	93	Dystrone	10mg Tab	10	30	3950	13.17	395	5334	17.78	300	10	0	DYST-26093	2027-04-28 00:00:00	t	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36ff0041rnoc5hbb5wpm	94	Ecomin	Tab	10	30	4100	13.67	410	5535	18.45	300	10	0	ECOM-26094	2028-07-28 00:00:00	f	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36ff0042rnochl8vmmti	95	EMA	2.5mg Tab	10	30	4250	14.17	425	5739	19.13	300	10	0	EMA-26095	2029-10-28 00:00:00	f	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36ff0043rnoc327wsotf	96	Enflor	Sachet / Cap	10	10	6480	64.8	648	8424	84.24	100	10	0	ENFL-26096	2027-01-28 00:00:00	t	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36ff0044rnocknqnwoou	97	Erythrocin	500mg Tab	10	30	4550	15.17	455	6144	20.48	300	10	0	ERYT-26097	2028-04-28 00:00:00	f	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36ff0045rnocy48ui8n8	98	ES Loprot	40mg Cap	10	30	4700	15.67	470	6345	21.15	300	10	0	ESLO-26098	2029-07-28 00:00:00	f	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36ff0046rnocl2ua2haw	99	Esowel	40mg Tab	10	30	4850	16.17	485	6549	21.83	300	10	0	ESOW-26099	2027-10-28 00:00:00	t	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36ff0047rnociaavqxdg	100	Evion	400mg Cap	10	30	5000	16.67	500	6750	22.5	300	10	0	EVIO-26100	2028-01-28 00:00:00	f	2026-11-06 12:22:44.81	2026-11-06 12:22:44.81
cmw4y36fo0048rnoc36qylmri	101	Famila	Inj	10	5	6690	133.8	669	9031.5	180.63	50	10	0	FAMI-26101	2029-04-28 00:00:00	f	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fo0049rnoc0xdp2gnv	102	Famila	Tab	10	30	5300	17.67	530	7155	23.85	300	10	0	FAMI-26102	2027-07-28 00:00:00	t	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fo004arnoci5hokrwv	103	Famot	20mg Tab	10	30	5450	18.17	545	7359	24.53	300	10	0	FAMO-26103	2028-10-28 00:00:00	f	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fo004brnoch8vky4f7	104	Famot	40mg Tab	10	30	5600	18.67	560	7560	25.2	300	10	0	FAMO-26104	2029-01-28 00:00:00	f	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fo004crnocz3n14wql	105	Fantizol	150mg Cap	10	30	5750	19.17	575	7764	25.88	300	10	0	FANT-26105	2027-04-28 00:00:00	t	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fo004drnochj3kqsmb	106	Fefan	Tab / Cap	10	30	5900	19.67	590	7965	26.55	300	10	0	FEFA-26106	2028-07-28 00:00:00	f	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fo004ernoc1vbi02gn	107	Fefolvit	Cap	10	30	6050	20.17	605	8169	27.23	300	10	0	FEFO-26107	2029-10-28 00:00:00	f	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fo004frnoc3k0at23b	108	Femiwin	120ml Susp	20	1	3120	156	156	3993.6	199.68	20	10	0	FEMI-26108	2027-01-28 00:00:00	t	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fo004grnocpp7h01oj	109	Fercari	Tab	10	30	6350	21.17	635	8574	28.58	300	10	0	FERC-26109	2028-04-28 00:00:00	f	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fo004hrnoc4gyojih9	110	Ferfer	Sachet / Drops	20	1	3400	170	170	4352	217.6	20	10	0	FERF-26110	2029-07-28 00:00:00	f	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fo004irnoce2fbx682	111	Ferfix-FA	Tab	10	30	6650	22.17	665	8979	29.93	300	10	0	FERF-26111	2027-10-28 00:00:00	t	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fo004jrnocql1nea8s	112	Feroxyma	50mg Tab	10	30	6800	22.67	680	9180	30.6	300	10	0	FERO-26112	2028-01-28 00:00:00	f	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fo004krnoc1zltpmqd	113	Ferrous Sulphate	Tab	10	30	6950	23.17	695	9384	31.28	300	10	0	FERR-26113	2029-04-28 00:00:00	f	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fo004lrnoch64jppfw	114	Ferti Plus	Sachet / Tab	10	10	8820	88.2	882	11466	114.66	100	10	0	FERT-26114	2027-07-28 00:00:00	t	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fp004mrnoclwlb1vuc	115	Ferti-C	5000 IU Inj	10	5	9350	187	935	12622.5	252.45	50	10	0	FERT-26115	2028-10-28 00:00:00	f	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fp004nrnocah8nmw04	116	Ferti-M	150 IU Inj	10	5	9540	190.8	954	12879	257.58	50	10	0	FERT-26116	2029-01-28 00:00:00	f	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fp004ornocokazhxee	117	Fertomid	50mg Tab	10	30	7550	25.17	755	10194	33.98	300	10	0	FERT-26117	2027-04-28 00:00:00	t	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fp004prnocx9420bcu	118	Fervail	200mg Tab	10	30	7700	25.67	770	10395	34.65	300	10	0	FERV-26118	2028-07-28 00:00:00	f	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fp004qrnocfi224df2	119	Fibrozon	Sachet / Tab	10	10	9470	94.7	947	12311	123.11	100	10	0	FIBR-26119	2029-10-28 00:00:00	f	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fp004rrnocu1c8gcsa	120	Fixinor	Tab	10	30	8000	26.67	800	10800	36	300	10	0	FIXI-26120	2027-01-28 00:00:00	t	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fp004srnoc433r6qp1	121	Flygel	Tab	10	30	8150	27.17	815	11004	36.68	300	10	0	FLYG-26121	2028-04-28 00:00:00	f	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fp004trnoct7ofb59x	122	Flygel	500mg/100ml IV Infusion	10	5	10680	213.6	1068	14418	288.36	50	10	0	FLYG-26122	2029-07-28 00:00:00	f	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fp004urnocoyu38yl8	123	Folic Acid	5mg Tab	10	30	8450	28.17	845	11409	38.03	300	10	0	FOLI-26123	2027-10-28 00:00:00	t	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fp004vrnoc1cm6hf1b	124	Fortis	Tab	10	30	8600	28.67	860	11610	38.7	300	10	0	FORT-26124	2028-01-28 00:00:00	f	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fp004wrnocits6uoil	125	Frecys	Sachet	10	10	6250	62.5	625	8125	81.25	100	10	0	FREC-26125	2029-04-28 00:00:00	f	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fp004xrnocqh01fhgs	126	Fudich	Cream / Ointment	15	1	3690	246	246	4797	319.8	15	10	0	FUDI-26126	2027-07-28 00:00:00	t	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fp004yrnoc6t00kmi8	127	Getryl	2mg Tab	10	30	9050	30.17	905	12219	40.73	300	10	0	GETR-26127	2028-10-28 00:00:00	f	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fp004zrnocd9hykn6o	128	Getryl	4mg Tab	10	30	9200	30.67	920	12420	41.4	300	10	0	GETR-26128	2029-01-28 00:00:00	f	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fp0050rnocxpyw7b5x	129	Glandin E2	Vaginal Gel / Tab	15	1	4185	279	279	5440.5	362.7	15	10	0	GLAN-26129	2027-04-28 00:00:00	t	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fp0051rnocde5jqwqn	130	Glucophage	500mg Tab	10	30	3000	10	300	4050	13.5	300	10	0	GLUC-26130	2028-07-28 00:00:00	f	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fp0052rnocu4awtm6h	131	Glycerine	Liquid / Suppository	20	1	2740	137	137	3507.2	175.36	20	10	0	GLYC-26131	2029-10-28 00:00:00	f	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fp0053rnocday72m65	132	Gravibinan	2mg Inj	10	5	4580	91.6	458	6183	123.66	50	10	0	GRAV-26132	2027-01-28 00:00:00	t	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fp0054rnoc6f5vqdar	133	Gravinate	Tab / Inj	10	5	4770	95.4	477	6439.5	128.79	50	10	0	GRAV-26133	2028-04-28 00:00:00	f	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fp0055rnocoblxatkj	134	GTN	Sublingual Tab / Spray	10	30	3600	12	360	4860	16.2	300	10	0	GTN-26134	2029-07-28 00:00:00	f	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fp0056rnocyphab89f	135	Gynosporine	Vaginal Tab / Suppository	10	30	3750	12.5	375	5064	16.88	300	10	0	GYNO-26135	2027-10-28 00:00:00	t	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fp0057rnocibyfbhbi	136	Gynostole	Cap / Sachet	10	10	7680	76.8	768	9984	99.84	100	10	0	GYNO-26136	2028-01-28 00:00:00	f	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fp0058rnoc88edxt06	137	Haemaccel	IV Infusion	10	5	5530	110.6	553	7465.5	149.31	50	10	0	HAEM-26137	2029-04-28 00:00:00	f	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fp0059rnocs3r44uym	138	Healet	Ointment	15	1	5670	378	378	7371	491.4	15	10	0	HEAL-26138	2027-07-28 00:00:00	t	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fp005arnocdtlkbag3	139	HI-CAL D	Tab	10	30	4350	14.5	435	5874	19.58	300	10	0	HICA-26139	2028-10-28 00:00:00	f	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fp005brnochfvhr2jw	140	HI-Vit 27	Tab	10	30	4500	15	450	6075	20.25	300	10	0	HIVI-26140	2029-01-28 00:00:00	f	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fp005crnockk1s1a3z	141	Hizone	1g Inj	10	5	6290	125.8	629	8491.5	169.83	50	10	0	HIZO-26141	2027-04-28 00:00:00	t	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fp005drnoc3mctb5pa	142	Hydrocortisone	100mg Inj	10	5	6480	129.6	648	8748	174.96	50	10	0	HYDR-26142	2028-07-28 00:00:00	f	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fp005ernocthbbxxjt	143	Hydrozole	Cream	15	1	3195	213	213	4153.5	276.9	15	10	0	HYDR-26143	2029-10-28 00:00:00	f	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fp005frnocdjnvs4z1	144	Hydryllin	120ml Syrup	20	1	4560	228	228	5836.8	291.84	20	10	0	HYDR-26144	2027-01-28 00:00:00	t	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fp005grnocxmgdnkum	145	Hydryllin DM	120ml Syrup	20	1	4700	235	235	6016	300.8	20	10	0	HYDR-26145	2028-04-28 00:00:00	f	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fp005hrnocbx2j88yw	146	Hyzonate	100mg Inj	10	5	7240	144.8	724	9774	195.48	50	10	0	HYZO-26146	2029-07-28 00:00:00	f	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fp005irnocty5s4s50	147	Ibert Folic	500mcg Tab	10	30	5550	18.5	555	7494	24.98	300	10	0	IBER-26147	2027-10-28 00:00:00	t	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fp005jrnocxe7auxuw	148	Icon	100mg Cap	10	30	5700	19	570	7695	25.65	300	10	0	ICON-26148	2028-01-28 00:00:00	f	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fp005krnocj4znuz25	149	Imatet	Tetanus Toxoid Inj	10	5	7810	156.2	781	10543.5	210.87	50	10	0	IMAT-26149	2029-04-28 00:00:00	f	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fp005lrnocw6llfkcj	150	Inderal	10mg / 40mg Tab	10	30	6000	20	600	8100	27	300	10	0	INDE-26150	2027-07-28 00:00:00	t	2026-11-06 12:22:44.82	2026-11-06 12:22:44.82
cmw4y36fw005mrnockeu6mbdq	151	Inventive	60ml Susp	20	1	5540	277	277	7091.2	354.56	20	10	0	INVE-26151	2028-10-28 00:00:00	f	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fw005nrnoc1bnid93p	152	Iraxin	Tab	10	30	6300	21	630	8505	28.35	300	10	0	IRAX-26152	2029-01-28 00:00:00	f	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fw005ornock5ahjlzi	153	Irofast	Tab / Sachet	10	10	9890	98.9	989	12857	128.57	100	10	0	IROF-26153	2027-04-28 00:00:00	t	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fw005prnocu98jy7z2	154	Iron One	Tab / Sachet	10	10	6020	60.2	602	7826	78.26	100	10	0	IRON-26154	2028-07-28 00:00:00	f	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fw005qrnocj8gpqmnk	155	Irose IV	100mg Iron Sucrose Infusion	10	5	8950	179	895	12082.5	241.65	50	10	0	IROS-26155	2029-10-28 00:00:00	f	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fw005rrnocd9lkpu59	156	KCL Ampoule	(Potassium Chloride)	10	30	6900	23	690	9315	31.05	300	10	0	KCLA-26156	2027-01-28 00:00:00	t	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fw005srnocw26ccy3w	157	Kestine	10mg / 20mg Tab	10	30	7050	23.5	705	9519	31.73	300	10	0	KEST-26157	2028-04-28 00:00:00	f	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fw005trnoch185etr0	158	Ketamine	Inj	10	5	9520	190.4	952	12852	257.04	50	10	0	KETA-26158	2029-07-28 00:00:00	f	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fw005urnocla911n4m	159	Ketgo	Inj	10	5	9710	194.2	971	13108.5	262.17	50	10	0	KETG-26159	2027-10-28 00:00:00	t	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fx005vrnoct8rpdgs3	160	Kipowel	30ml Drops / Susp	20	1	3200	160	160	4096	204.8	20	10	0	KIPO-26160	2028-01-28 00:00:00	f	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fx005wrnocvqtslnje	161	K-Lot	Inj (Phytomenadione/Tranexamic)	10	5	10090	201.8	1009	13621.5	272.43	50	10	0	KLOT-26161	2029-04-28 00:00:00	f	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fx005xrnoc091f6w31	162	Labetalol	100mg Tab / Inj	10	5	10280	205.6	1028	13878	277.56	50	10	0	LABE-26162	2027-07-28 00:00:00	t	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fx005yrnoc92ov140r	163	Lacto 1	220g Formula Milk	10	30	7950	26.5	795	10734	35.78	300	10	0	LACT-26163	2028-10-28 00:00:00	f	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fx005zrnoc84tcbhh4	164	Lasix	20mg / 40mg Inj / Tab	10	5	10660	213.2	1066	14391	287.82	50	10	0	LASI-26164	2029-01-28 00:00:00	f	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fx0060rnoctbiw8l9w	165	Laxoberon	Drops	20	1	3900	195	195	4992	249.6	20	10	0	LAXO-26165	2027-04-28 00:00:00	t	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fx0061rnocu9rq2xdr	166	Laxoberon	5mg Tab	10	30	8400	28	840	11340	37.8	300	10	0	LAXO-26166	2028-07-28 00:00:00	f	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fx0062rnocg9k65lap	167	Lebreta	2.5mg Tab	10	30	8550	28.5	855	11544	38.48	300	10	0	LEBR-26167	2029-10-28 00:00:00	f	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fx0063rnocpa7mdpj6	168	Lederplex	120ml Syrup	20	1	4320	216	216	5529.6	276.48	20	10	0	LEDE-26168	2027-01-28 00:00:00	t	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fx0064rnocqm618yu2	169	Leflox	250mg Tab	10	30	8850	29.5	885	11949	39.83	300	10	0	LEFL-26169	2028-04-28 00:00:00	f	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fx0065rnocyslmuhn0	170	Leflox	500mg Tab	10	30	9000	30	900	12150	40.5	300	10	0	LEFL-26170	2029-07-28 00:00:00	f	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fx0066rnocr2psheoz	171	Levo	500mg Tab	10	30	9150	30.5	915	12354	41.18	300	10	0	LEVO-26171	2027-10-28 00:00:00	t	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fx0067rnocx9ngdc60	172	Levofin	Tab	10	30	9300	31	930	12555	41.85	300	10	0	LEVO-26172	2028-01-28 00:00:00	f	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fx0068rnoca4um3ye5	173	Liquid Paraffin	Liquid	20	1	5020	251	251	6425.6	321.28	20	10	0	LIQU-26173	2029-04-28 00:00:00	f	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fx0069rnocc6saex60	174	Locyst	Sachet	10	10	8620	86.2	862	11206	112.06	100	10	0	LOCY-26174	2027-07-28 00:00:00	t	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fx006arnoc6czu08q7	175	Loprin	75mg Tab	10	30	3250	10.83	325	4389	14.63	300	10	0	LOPR-26175	2028-10-28 00:00:00	f	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fx006brnocx9ovxby7	176	Loprin	150mg Tab	10	30	3400	11.33	340	4590	15.3	300	10	0	LOPR-26176	2029-01-28 00:00:00	f	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fx006crnoc8ov3351n	177	Lysovit	Syrup	20	1	5580	279	279	7142.4	357.12	20	10	0	LYSO-26177	2027-04-28 00:00:00	t	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fx006drnoc4nl5y5dh	178	Macapex	Tab / Sachet	10	10	9140	91.4	914	11882	118.82	100	10	0	MACA-26178	2028-07-28 00:00:00	f	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fx006ernoc44a79er2	179	Magnesium Sulphate	Inj / Solution	10	5	5510	110.2	551	7438.5	148.77	50	10	0	MAGN-26179	2029-10-28 00:00:00	f	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fx006frnocedq2szp6	180	Mam 2B Sugar Free	Powder / Sachet	10	10	9400	94	940	12220	122.2	100	10	0	MAM2-26180	2027-01-28 00:00:00	t	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fx006grnoc47bw3of2	181	Maxeed	Sachet	10	10	9530	95.3	953	12389	123.89	100	10	0	MAXE-26181	2028-04-28 00:00:00	f	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fx006hrnoc8to14l9g	182	Maxolon	Inj	10	5	6080	121.6	608	8208	164.16	50	10	0	MAXO-26182	2029-07-28 00:00:00	f	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fx006irnocblozkozv	183	Maxolon	Tab	10	30	4450	14.83	445	6009	20.03	300	10	0	MAXO-26183	2027-10-28 00:00:00	t	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fx006jrnocqpesa2se	184	Mebrotol	2.5mg Tab	10	30	4600	15.33	460	6210	20.7	300	10	0	MEBR-26184	2028-01-28 00:00:00	f	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fx006krnoc0c4eyrsi	185	Metofol	400mcg Tab	10	30	4750	15.83	475	6414	21.38	300	10	0	METO-26185	2029-04-28 00:00:00	f	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fx006lrnocutvy2oo1	186	Mom Folic Max	Tab	10	30	4900	16.33	490	6615	22.05	300	10	0	MOMF-26186	2027-07-28 00:00:00	t	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fx006mrnoc3xl1f0a5	187	Mosegor	60ml Syrup	20	1	3380	169	169	4326.4	216.32	20	10	0	MOSE-26187	2028-10-28 00:00:00	f	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fx006nrnocbk4mt9fu	188	Motilium	10mg Tab	10	30	5200	17.33	520	7020	23.4	300	10	0	MOTI-26188	2029-01-28 00:00:00	f	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fx006ornocobrb4945	189	Multical	Tab	10	30	5350	17.83	535	7221	24.07	300	10	0	MULT-26189	2027-04-28 00:00:00	t	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fx006prnocrqma7qu2	190	Mycitracin	Ointment	15	1	4350	290	290	5655	377	15	10	0	MYCI-26190	2028-07-28 00:00:00	f	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fx006qrnocbdejhq5j	191	Myojem Plus	Sachet	10	10	6830	68.3	683	8879	88.79	100	10	0	MYOJ-26191	2029-10-28 00:00:00	f	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fx006rrnocb3909ep7	192	Neurobion	Tab / Inj	10	5	7980	159.6	798	10773	215.46	50	10	0	NEUR-26192	2027-01-28 00:00:00	t	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fx006srnocq3e6w988	193	Nexum	40mg Tab / Cap	10	30	5950	19.83	595	8031	26.77	300	10	0	NEXU-26193	2028-04-28 00:00:00	f	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fx006trnoctdvztufk	194	Nezkil	600mg Tab	10	30	6100	20.33	610	8235	27.45	300	10	0	NEZK-26194	2029-07-28 00:00:00	f	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fx006urnocci9ewttp	195	Nifedil	10mg Tab	10	30	6250	20.83	625	8439	28.13	300	10	0	NIFE-26195	2027-10-28 00:00:00	t	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fx006vrnoczr1i2jm9	196	Nifedil XL	30mg Tab	10	30	6400	21.33	640	8640	28.8	300	10	0	NIFE-26196	2028-01-28 00:00:00	f	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fx006wrnocwny10p8e	197	Nilstat	Drops	20	1	4780	239	239	6118.4	305.92	20	10	0	NILS-26197	2029-04-28 00:00:00	f	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fx006xrnoc8qrf3emm	198	Nitrofast	Tab / Sachet	10	10	7740	77.4	774	10062	100.62	100	10	0	NITR-26198	2027-07-28 00:00:00	t	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fx006yrnocbrfdm0zt	199	Noregyn	5mg Tab	10	30	6850	22.83	685	9246	30.82	300	10	0	NORE-26199	2028-10-28 00:00:00	f	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36fx006zrnocmrqfqjrz	200	Nospa	40mg Tab	10	30	7000	23.33	700	9450	31.5	300	10	0	NOSP-26200	2029-01-28 00:00:00	f	2026-11-06 12:22:44.828	2026-11-06 12:22:44.828
cmw4y36g50070rnoceygl4yyg	201	Nospa Fort	80mg Tab	10	30	7150	23.83	715	9651	32.17	300	10	0	NOSP-26201	2027-04-28 00:00:00	t	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g50071rnoclkrb40gg	202	Nalbuphine	Inj 10mg/ml	10	5	9880	197.6	988	13338	266.76	50	10	0	NALB-26202	2028-07-28 00:00:00	f	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g50072rnocyv3oeen2	203	Numil Stage 1	Formula	10	30	7450	24.83	745	10056	33.52	300	10	0	NUMI-26203	2029-10-28 00:00:00	f	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g50073rnoc3vujiim9	204	Obsical	Sachet	10	10	8520	85.2	852	11076	110.76	100	10	0	OBSI-26204	2027-01-28 00:00:00	t	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g50074rnocx97hqu2y	205	One Natal	Tab	10	30	7750	25.83	775	10464	34.88	300	10	0	ONEN-26205	2028-04-28 00:00:00	f	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g50075rnocpnexn612	206	ORS	Oral Rehydration Sachet	10	10	8780	87.8	878	11414	114.14	100	10	0	ORS-26206	2029-07-28 00:00:00	f	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g50076rnocq2wgsdni	207	Orslim	120mg Cap	10	30	8050	26.83	805	10869	36.23	300	10	0	ORSL-26207	2027-10-28 00:00:00	t	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g50077rnoc0404au00	208	Osam-D	Tab	10	30	8200	27.33	820	11070	36.9	300	10	0	OSAM-26208	2028-01-28 00:00:00	f	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g50078rnocz1mupayk	209	Oslia	Sachet / Tab	10	10	9170	91.7	917	11921	119.21	100	10	0	OSLI-26209	2029-04-28 00:00:00	f	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g50079rnoclkocv6tp	210	Osso-D	Tab	10	30	8500	28.33	850	11475	38.25	300	10	0	OSSO-26210	2027-07-28 00:00:00	t	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g5007arnoclrlxigit	211	Ottaso	40mg Cap	10	30	8650	28.83	865	11679	38.93	300	10	0	OTTA-26211	2028-10-28 00:00:00	f	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g5007brnocgomna2cd	212	Ovarise	Sachet	10	10	9560	95.6	956	12428	124.28	100	10	0	OVAR-26212	2029-01-28 00:00:00	f	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g6007crnocbkemo04o	213	Oxidil	500mg Inj	10	5	3970	79.4	397	5359.5	107.19	50	10	0	OXID-26213	2027-04-28 00:00:00	t	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g6007drnoc0cr2e59r	214	Oxidil	1g Inj	10	5	4160	83.2	416	5616	112.32	50	10	0	OXID-26214	2028-07-28 00:00:00	f	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g6007ernocy4thvksg	215	Oxidil	2g IV Infusion	10	5	4350	87	435	5872.5	117.45	50	10	0	OXID-26215	2029-10-28 00:00:00	f	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g6007frnoc7scmzv6q	216	Oxoferin	Solution	10	30	9400	31.33	940	12690	42.3	300	10	0	OXOF-26216	2027-01-28 00:00:00	t	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g6007grnocikzodcuf	217	Panadol	Tab	10	30	3050	10.17	305	4116	13.72	300	10	0	PANA-26217	2028-04-28 00:00:00	f	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g6007hrnocr10b6r0x	218	Panadol	Drops	20	1	4120	206	206	5273.6	263.68	20	10	0	PANA-26218	2029-07-28 00:00:00	f	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g6007irnockc8miwcl	219	Panamin-G	500ml Infusion	10	5	5110	102.2	511	6898.5	137.97	50	10	0	PANA-26219	2027-10-28 00:00:00	t	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g6007jrnocjczny0h5	220	Paradox Omega	Cap	10	30	3500	11.67	350	4725	15.75	300	10	0	PARA-26220	2028-01-28 00:00:00	f	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g6007krnoc3ythvkjd	221	Pepsin	120ml Syrup	20	1	4540	227	227	5811.2	290.56	20	10	0	PEPS-26221	2029-04-28 00:00:00	f	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g6007lrnoctm5ae1gu	222	Permen	Tab	10	30	3800	12.67	380	5130	17.1	300	10	0	PERM-26222	2027-07-28 00:00:00	t	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g7007mrnoc6l4t9k56	223	Polygynax	Vaginal Cap	10	30	3950	13.17	395	5334	17.78	300	10	0	POLY-26223	2028-10-28 00:00:00	f	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g7007nrnocdrmaagie	224	Ponstan	250mg Tab	10	30	4100	13.67	410	5535	18.45	300	10	0	PONS-26224	2029-01-28 00:00:00	f	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g7007ornocrl11w6vz	225	Ponstan Forte	500mg Tab	10	30	4250	14.17	425	5739	19.13	300	10	0	PONS-26225	2027-04-28 00:00:00	t	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g7007prnocpfjq7rfo	226	Pregnofer	Tab	10	30	4400	14.67	440	5940	19.8	300	10	0	PREG-26226	2028-07-28 00:00:00	f	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g7007qrnoc2iw01nqw	227	Primo	Tab / Sachet	10	10	7510	75.1	751	9763	97.63	100	10	0	PRIM-26227	2029-10-28 00:00:00	f	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g7007rrnocl0vgp3bk	228	Primolut-N	5mg Tab	10	30	4700	15.67	470	6345	21.15	300	10	0	PRIM-26228	2027-01-28 00:00:00	t	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g7007srnocbbwebuku	229	Pregnancycare	Tab	10	30	4850	16.17	485	6549	21.83	300	10	0	PREG-26229	2028-04-28 00:00:00	f	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g7007trnoch5g8kliu	230	Propofol 1%	Inj / Infusion	10	5	7200	144	720	9720	194.4	50	10	0	PROP-26230	2029-07-28 00:00:00	f	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g7007urnocjm0v52em	231	Prosotec	200mcg Tab	10	30	5150	17.17	515	6954	23.18	300	10	0	PROS-26231	2027-10-28 00:00:00	t	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g7007vrnoc86orw6d0	232	Pubergen	5000 IU Inj	10	5	7580	151.6	758	10233	204.66	50	10	0	PUBE-26232	2028-01-28 00:00:00	f	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g7007wrnocuoy1qv1w	233	Qalsium D	Tab	10	30	5450	18.17	545	7359	24.53	300	10	0	QALS-26233	2029-04-28 00:00:00	f	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g7007xrnocuikc8hxj	234	Qalsium D Mix	Sachet	10	10	8420	84.2	842	10946	109.46	100	10	0	QALS-26234	2027-07-28 00:00:00	t	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g7007yrnocvfrg98al	235	Q-Bact	1g Inj	10	5	8150	163	815	11002.5	220.05	50	10	0	QBAC-26235	2028-10-28 00:00:00	f	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g7007zrnoczid1qctv	236	Q-Bact	2g Inj	10	5	8340	166.8	834	11259	225.18	50	10	0	QBAC-26236	2029-01-28 00:00:00	f	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g70080rnocvzwu2dd8	237	Qick-D	Tab / Drops	20	1	3180	159	159	4070.4	203.52	20	10	0	QICK-26237	2027-04-28 00:00:00	t	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g70081rnocwzzg65dg	238	Q-Line	Tab	10	30	6200	20.67	620	8370	27.9	300	10	0	QLIN-26238	2028-07-28 00:00:00	f	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g70082rnocpv053g27	239	Reltus DM	120ml Syrup	20	1	3460	173	173	4428.8	221.44	20	10	0	RELT-26239	2029-10-28 00:00:00	f	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g70083rnocebw9mxei	240	RG Vit F	Tab	10	30	6500	21.67	650	8775	29.25	300	10	0	RGVI-26240	2027-01-28 00:00:00	t	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g70084rnocl9vmx03v	241	Rhizofem	40mg Tab	10	30	6650	22.17	665	8979	29.93	300	10	0	RHIZ-26241	2028-04-28 00:00:00	f	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g70085rnoca5uv5n2n	242	Risek Insta	20mg / 40mg Sachet	10	10	9460	94.6	946	12298	122.98	100	10	0	RISE-26242	2029-07-28 00:00:00	f	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g70086rnoc1o79j5fv	243	Rocid-E	Tab	10	30	6950	23.17	695	9384	31.28	300	10	0	ROCI-26243	2027-10-28 00:00:00	t	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g70087rnocasw24dr4	244	Rulling	40mg Tab	10	30	7100	23.67	710	9585	31.95	300	10	0	RULL-26244	2028-01-28 00:00:00	f	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g70088rnoc8hh9yndl	245	Sangobion	Cap	10	30	7250	24.17	725	9789	32.63	300	10	0	SANG-26245	2029-04-28 00:00:00	f	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g70089rnocj6toc2ca	246	Scabo	Lotion / Cream	20	1	4440	222	222	5683.2	284.16	20	10	0	SCAB-26246	2027-07-28 00:00:00	t	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g7008arnocgsu3o0kd	247	Sebesta	Tab	10	30	7550	25.17	755	10194	33.98	300	10	0	SEBE-26247	2028-10-28 00:00:00	f	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g7008brnoc90bjefqt	248	Sergifex	1g Inj	10	5	10620	212.4	1062	14337	286.74	50	10	0	SERG-26248	2029-01-28 00:00:00	f	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g7008crnocixpgoy54	249	SG Indrop D	Oral Ampoule / Inj	10	5	10810	216.2	1081	14593.5	291.87	50	10	0	SGIN-26249	2027-04-28 00:00:00	t	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36g7008drnoc95mmsp9t	250	Skilax	30ml Drops	20	1	5000	250	250	6400	320	20	10	0	SKIL-26250	2028-07-28 00:00:00	f	2026-11-06 12:22:44.837	2026-11-06 12:22:44.837
cmw4y36gf008ernocmz8v4l4h	251	Softin	10mg Tab	10	30	8150	27.17	815	11004	36.68	300	10	0	SOFT-26251	2029-10-28 00:00:00	f	2026-11-06 12:22:44.847	2026-11-06 12:22:44.847
cmw4y36gf008frnocp79ywsi1	252	Sofvasc	5mg Tab	10	30	8300	27.67	830	11205	37.35	300	10	0	SOFV-26252	2027-01-28 00:00:00	t	2026-11-06 12:22:44.847	2026-11-06 12:22:44.847
cmw4y36gf008grnocy1xvc9l7	253	Sofvasc	10mg Tab	10	30	8450	28.17	845	11409	38.03	300	10	0	SOFV-26253	2028-04-28 00:00:00	f	2026-11-06 12:22:44.847	2026-11-06 12:22:44.847
cmw4y36gf008hrnocmr2or1ii	254	Spasfon	Tab / Inj	10	5	3760	75.2	376	5076	101.52	50	10	0	SPAS-26254	2029-07-28 00:00:00	f	2026-11-06 12:22:44.847	2026-11-06 12:22:44.847
cmw4y36gf008irnoc5ybyuw8p	255	Spasler Neo	Tab	10	30	8750	29.17	875	11814	39.38	300	10	0	SPAS-26255	2027-10-28 00:00:00	t	2026-11-06 12:22:44.847	2026-11-06 12:22:44.847
cmw4y36gf008jrnocaq9mga9z	256	Spasler-P	Tab	10	30	8900	29.67	890	12015	40.05	300	10	0	SPAS-26256	2028-01-28 00:00:00	f	2026-11-06 12:22:44.847	2026-11-06 12:22:44.847
cmw4y36gf008krnocq09gp3h5	257	Stemetil	5mg Tab	10	30	9050	30.17	905	12219	40.73	300	10	0	STEM-26257	2029-04-28 00:00:00	f	2026-11-06 12:22:44.847	2026-11-06 12:22:44.847
cmw4y36gf008lrnoc0emqbvp5	258	Sulzone	1g Inj	10	5	4520	90.4	452	6102	122.04	50	10	0	SULZ-26258	2027-07-28 00:00:00	t	2026-11-06 12:22:44.847	2026-11-06 12:22:44.847
cmw4y36gf008mrnoco1gk1a8t	259	Sunvit Vitamin D3	Tab / Drops	20	1	2660	133	133	3404.8	170.24	20	10	0	SUNV-26259	2028-10-28 00:00:00	f	2026-11-06 12:22:44.847	2026-11-06 12:22:44.847
cmw4y36gf008nrnoc8zbwxa4o	260	Supravit	Syrup / Tab	20	1	2800	140	140	3584	179.2	20	10	0	SUPR-26260	2029-01-28 00:00:00	f	2026-11-06 12:22:44.847	2026-11-06 12:22:44.847
cmw4y36gf008ornoc0pccqxm7	261	Syneflex	Tab	10	30	3150	10.5	315	4254	14.18	300	10	0	SYNE-26261	2027-04-28 00:00:00	t	2026-11-06 12:22:44.847	2026-11-06 12:22:44.847
cmw4y36gf008prnocdtwnj2hv	262	Syntocinon (Synto)	Inj 5 IU / 10 IU	10	5	5280	105.6	528	7128	142.56	50	10	0	SYNT-26262	2028-07-28 00:00:00	f	2026-11-06 12:22:44.847	2026-11-06 12:22:44.847
cmw4y36gf008qrnoc5ja1xp8a	263	Thyroxin	50mcg Tab	10	30	3450	11.5	345	4659	15.53	300	10	0	THYR-26263	2029-10-28 00:00:00	f	2026-11-06 12:22:44.847	2026-11-06 12:22:44.847
cmw4y36gf008rrnocxsvryo9x	264	Toradol	Inj 30mg/ml	10	5	5660	113.2	566	7641	152.82	50	10	0	TORA-26264	2027-01-28 00:00:00	t	2026-11-06 12:22:44.847	2026-11-06 12:22:44.847
cmw4y36gf008srnoc27owrq3k	265	Transamin	500mg Cap	10	30	3750	12.5	375	5064	16.88	300	10	0	TRAN-26265	2028-04-28 00:00:00	f	2026-11-06 12:22:44.847	2026-11-06 12:22:44.847
cmw4y36gf008trnocl30mg0sg	266	Transamin	500mg Inj	10	5	6040	120.8	604	8154	163.08	50	10	0	TRAN-26266	2029-07-28 00:00:00	f	2026-11-06 12:22:44.847	2026-11-06 12:22:44.847
cmw4y36gf008urnoconnbja88	267	Traxart	650mg Tab	10	30	4050	13.5	405	5469	18.23	300	10	0	TRAX-26267	2027-10-28 00:00:00	t	2026-11-06 12:22:44.847	2026-11-06 12:22:44.847
cmw4y36gf008vrnoctuf965h0	268	Trichogen	Tab / Solution	10	30	4200	14	420	5670	18.9	300	10	0	TRIC-26268	2028-01-28 00:00:00	f	2026-11-06 12:22:44.847	2026-11-06 12:22:44.847
cmw4y36gf008wrnoclt6dc05e	269	Trisave	500mg Tab	10	30	4350	14.5	435	5874	19.58	300	10	0	TRIS-26269	2029-04-28 00:00:00	f	2026-11-06 12:22:44.847	2026-11-06 12:22:44.847
cmw4y36gf008xrnoc7awza2h2	270	Tynoseed	Gel	15	1	4350	290	290	5655	377	15	10	0	TYNO-26270	2027-07-28 00:00:00	t	2026-11-06 12:22:44.847	2026-11-06 12:22:44.847
cmw4y36gf008yrnoc5mdvkwg7	271	Ubkino	8mg Tab	10	30	4650	15.5	465	6279	20.93	300	10	0	UBKI-26271	2028-10-28 00:00:00	f	2026-11-06 12:22:44.847	2026-11-06 12:22:44.847
cmw4y36gf008zrnoclflyshkx	272	Uresol	Sachet	10	10	9360	93.6	936	12168	121.68	100	10	0	URES-26272	2029-01-28 00:00:00	f	2026-11-06 12:22:44.847	2026-11-06 12:22:44.847
cmw4y36gf0090rnocf6phje3l	273	Urso	250mg Tab	10	30	4950	16.5	495	6684	22.28	300	10	0	URSO-26273	2027-04-28 00:00:00	t	2026-11-06 12:22:44.847	2026-11-06 12:22:44.847
cmw4y36gf0091rnoc2iqf3myl	274	Velosef	500mg Cap	10	30	5100	17	510	6885	22.95	300	10	0	VELO-26274	2028-07-28 00:00:00	f	2026-11-06 12:22:44.847	2026-11-06 12:22:44.847
cmw4y36gg0092rnoch16r34r2	275	Vepev	20mg Tab	10	30	5250	17.5	525	7089	23.63	300	10	0	VEPE-26275	2029-10-28 00:00:00	f	2026-11-06 12:22:44.847	2026-11-06 12:22:44.847
cmw4y36gg0093rnoc59cod24p	276	Vermox	100mg Tab / Susp	20	1	5040	252	252	6451.2	322.56	20	10	0	VERM-26276	2027-01-28 00:00:00	t	2026-11-06 12:22:44.847	2026-11-06 12:22:44.847
cmw4y36gg0094rnocipggqurq	277	Voltral Emulgel 1%	Gel	15	1	5505	367	367	7156.5	477.1	15	10	0	VOLT-26277	2028-04-28 00:00:00	f	2026-11-06 12:22:44.847	2026-11-06 12:22:44.847
cmw4y36gg0095rnocis68cx23	278	Voltral Emulgel 2% Forte	Gel	15	1	5670	378	378	7371	491.4	15	10	0	VOLT-26278	2029-07-28 00:00:00	f	2026-11-06 12:22:44.847	2026-11-06 12:22:44.847
cmw4y36gg0096rnocug5jhwzk	279	Voren SR	100mg Tab	10	30	5850	19.5	585	7899	26.33	300	10	0	VORE-26279	2027-10-28 00:00:00	t	2026-11-06 12:22:44.847	2026-11-06 12:22:44.847
cmw4y36gg0097rnocv5x4j473	280	Xoderon	8mg Tab	10	30	6000	20	600	8100	27	300	10	0	XODE-26280	2028-01-28 00:00:00	f	2026-11-06 12:22:44.847	2026-11-06 12:22:44.847
cmw4y36gg0098rnocuz9ls11x	281	Xyloaid	2% Inj	10	5	8890	177.8	889	12001.5	240.03	50	10	0	XYLO-26281	2029-04-28 00:00:00	f	2026-11-06 12:22:44.847	2026-11-06 12:22:44.847
cmw4y36gg0099rnoc5ni1g49s	282	Xyloaid	2% Jelly	15	1	3030	202	202	3939	262.6	15	10	0	XYLO-26282	2027-07-28 00:00:00	t	2026-11-06 12:22:44.847	2026-11-06 12:22:44.847
cmw4y36gg009arnocdl85a1vl	283	YAZ	Tab	10	30	6450	21.5	645	8709	29.03	300	10	0	YAZ-26283	2028-10-28 00:00:00	f	2026-11-06 12:22:44.847	2026-11-06 12:22:44.847
cmw4y36gg009brnocdpvhc5vt	284	Zeegap	50mg Cap	10	30	6600	22	660	8910	29.7	300	10	0	ZEEG-26284	2029-01-28 00:00:00	f	2026-11-06 12:22:44.847	2026-11-06 12:22:44.847
cmw4y36gg009crnocfxwaclue	285	Zetro	50mg / 250mg Susp / Tab	20	1	2700	135	135	3456	172.8	20	10	0	ZETR-26285	2027-04-28 00:00:00	t	2026-11-06 12:22:44.847	2026-11-06 12:22:44.847
cmw4y36gg009drnocke46hzvg	286	Zinacef	250mg Inj	10	5	9840	196.8	984	13284	265.68	50	10	0	ZINA-26286	2028-07-28 00:00:00	f	2026-11-06 12:22:44.847	2026-11-06 12:22:44.847
cmw4y36gg009ernoct6fs2m98	287	Zofran	8mg Tab / Inj	10	5	10030	200.6	1003	13540.5	270.81	50	10	0	ZOFR-26287	2029-10-28 00:00:00	f	2026-11-06 12:22:44.847	2026-11-06 12:22:44.847
cmw4y36gg009frnochcpd3qrx	288	Zoldap	600mg Tab	10	30	7200	24	720	9720	32.4	300	10	0	ZOLD-26288	2027-01-28 00:00:00	t	2026-11-06 12:22:44.847	2026-11-06 12:22:44.847
cmw4y36gg009grnocvy7q1l2n	289	Zyto	250mg Tab	10	30	7350	24.5	735	9924	33.08	300	10	0	ZYTO-26289	2028-04-28 00:00:00	f	2026-11-06 12:22:44.847	2026-11-06 12:22:44.847
cmw4y36f4001lrnoccjnk7gg3	6	AG-VONO	Tab	10	30	3900	13	390	5265	17	1000	25	0	AGVO-26006	2027-07-28 00:00:00	t	2026-11-06 12:22:44.8	2026-11-18 06:13:57.779
\.


--
-- Data for Name: Patient; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Patient" (id, "patientUid", name, phone, age, gender, cnic, "biometricHash", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PatientBiometricEnrollment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PatientBiometricEnrollment" (id, "patientId", "fingerPosition", "encryptedTemplate", "templateAlgorithm", "qualityScore", "scannerModel", "adapterType", "enrolledById", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PharmacySale; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PharmacySale" (id, "saleNumber", "patientId", "userId", "totalAmount", discount, "createdAt") FROM stdin;
\.


--
-- Data for Name: PharmacySaleItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PharmacySaleItem" (id, "saleId", "medicineId", "itemType", quantity, "unitPrice", "totalPrice") FROM stdin;
\.


--
-- Data for Name: PurchaseOrder; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PurchaseOrder" (id, "poNumber", "vendorId", "totalAmount", "paidAmount", "paymentStatus", status, notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PurchaseOrderItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PurchaseOrderItem" (id, "purchaseOrderId", "medicineName", "genericName", quantity, "unitPrice", "totalPrice") FROM stdin;
\.


--
-- Data for Name: ShiftClosing; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ShiftClosing" (id, "userId", portal, "shiftDate", "totalSystemCash", "countedCash", variance, notes, status, "approvedById", "adminComment", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: StockBatch; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."StockBatch" (id, "medicineId", "batchNumber", quantity, "purchasePrice", "sellingPrice", "perOff", "mfgDate", "expiryDate", "approvalStatus", "createdAt") FROM stdin;
cmw4xho1f00da11ejpjzqzd50	cmw4xho1d00d811ejmkgdjczg	ABOC-26001	999	3150	1418	0	2026-04-28 00:00:00	2028-04-28 00:00:00	APPROVED	2026-11-06 12:06:01.204
cmw4xhnu8009s11ejxuxfjox3	cmw4xhnu5009q11ejmhoen3eg	3WAY-2026-04	250	45	65	0	2025-12-31 00:00:00	2027-12-31 00:00:00	APPROVED	2026-11-06 12:06:00.944
cmw4xhnud009v11ej43onhynr	cmw4xhnub009t11eja203teip	CAN-18G-2605	500	70	95	0	2026-04-30 00:00:00	2028-04-30 00:00:00	APPROVED	2026-11-06 12:06:00.95
cmw4xhnui009y11ejr3pa76kd	cmw4xhnug009w11ejj8wrz85b	CAN-20G-2606	750	70	95	0	2026-05-31 00:00:00	2028-05-31 00:00:00	APPROVED	2026-11-06 12:06:00.955
cmw4xhnuo00a111ejopp22l1c	cmw4xhnul009z11ejbxd913sj	CAN-22G-2607	600	70	95	0	2026-05-31 00:00:00	2028-05-31 00:00:00	APPROVED	2026-11-06 12:06:00.96
cmw4xhnut00a411ej2cumok6t	cmw4xhnuq00a211ej4lrcmt8g	CAN-24G-2608	400	75	105	0	2026-03-31 00:00:00	2028-03-31 00:00:00	APPROVED	2026-11-06 12:06:00.965
cmw4xhnv100a711ejf8j4r1y3	cmw4xhnux00a511ejgztxs4ph	DW5-500-2609	20	130	165	0	2025-10-31 00:00:00	2027-10-31 00:00:00	APPROVED	2026-11-06 12:06:00.974
cmw4xhnva00aa11ejvinemb1z	cmw4xhnv600a811ejj0z82j6r	DW5-100-2610	15	195	240	0	2025-11-30 00:00:00	2027-11-30 00:00:00	APPROVED	2026-11-06 12:06:00.982
cmw4xhnvh00ad11ejq3b69d8q	cmw4xhnve00ab11ej3gvma48h	NS09-100-2611	30	95	130	0	2025-09-30 00:00:00	2027-09-30 00:00:00	APPROVED	2026-11-06 12:06:00.99
cmw4xhnvo00ag11ej7mzg4bim	cmw4xhnvl00ae11ejdtcrxioj	NS09-500-2612	50	125	160	0	2025-10-31 00:00:00	2027-10-31 00:00:00	APPROVED	2026-11-06 12:06:00.997
cmw4xhnvv00aj11ejj9jtx829	cmw4xhnvs00ah11ejd1eqfoan	NS09-1K-2613	40	185	235	0	2025-12-31 00:00:00	2027-12-31 00:00:00	APPROVED	2026-11-06 12:06:01.003
cmw4xhnw400am11ejbdnlvwlu	cmw4xhnvz00ak11ejhlj9u8o6	RL-500-2614	30	140	180	0	2025-08-31 00:00:00	2027-08-31 00:00:00	APPROVED	2026-11-06 12:06:01.013
cmw4xhnwb00ap11ej42peqniw	cmw4xhnw800an11ejoyb0o6dp	RL-1000-2615	25	205	260	0	2025-08-31 00:00:00	2027-08-31 00:00:00	APPROVED	2026-11-06 12:06:01.02
cmw4xhnwm00av11ej4x0iyqgt	cmw4xhnwj00at11ej6ycpece0	GAU-10X-2617	250	45	65	0	2027-02-28 00:00:00	2029-02-28 00:00:00	APPROVED	2026-11-06 12:06:01.03
cmw4xhnws00ay11ejtx3xbxpn	cmw4xhnwo00aw11ejyzatuj6p	BBY-FDR-2618	120	150	220	0	2028-01-01 00:00:00	2030-01-01 00:00:00	APPROVED	2026-11-06 12:06:01.036
cmw4xhnwy00b111ej8niwmlyx	cmw4xhnwv00az11ej5xe3kjhb	BSU-06F-2619	200	55	85	0	2026-07-31 00:00:00	2028-07-31 00:00:00	APPROVED	2026-11-06 12:06:01.043
cmw4xhnx500b411ej5676ypzj	cmw4xhnx200b211ejuu9dxzr6	CRD-CLP-2620	500	25	45	0	2027-05-31 00:00:00	2029-05-31 00:00:00	APPROVED	2026-11-06 12:06:01.049
cmw4xhnxc00b711ej0ryi01eu	cmw4xhnx800b511ejj64g0aoo	DIA-MON-2621	50	450	620	0	2026-11-30 00:00:00	2028-11-30 00:00:00	APPROVED	2026-11-06 12:06:01.056
cmw4xhnxj00ba11ejlc33i8c6	cmw4xhnxf00b811ejjukqo8a2	FOL-16F-2622	100	220	310	0	2026-09-30 00:00:00	2028-09-30 00:00:00	APPROVED	2026-11-06 12:06:01.063
cmw4xhnxp00bd11ejnr1xx3fe	cmw4xhnxm00bb11ejpquuym9h	ENM-SET-2623	90	200	280	0	2025-06-30 00:00:00	2027-06-30 00:00:00	APPROVED	2026-11-06 12:06:01.069
cmw4xhnxv00bg11ej8aw21ebf	cmw4xhnxs00be11ejic4anuiv	IVS-GRA-2624	375	65	90	0	2026-10-31 00:00:00	2028-10-31 00:00:00	APPROVED	2026-11-06 12:06:01.076
cmw4xhny100bj11ejih6urcs9	cmw4xhnxy00bh11ejhjzy8g44	IVS-YPT-2625	250	85	120	0	2026-10-31 00:00:00	2028-10-31 00:00:00	APPROVED	2026-11-06 12:06:01.081
cmw4xhny500bm11ejdckgo9yk	cmw4xhny300bk11ej8828jnni	JAD-2RO-2626	20	2900	3800	0	2026-12-31 00:00:00	2028-12-31 00:00:00	APPROVED	2026-11-06 12:06:01.086
cmw4xhnyb00bp11ej8fm9ll3w	cmw4xhny900bn11ej4klpg74n	NEL-16F-2627	200	70	105	0	2026-08-31 00:00:00	2028-08-31 00:00:00	APPROVED	2026-11-06 12:06:01.092
cmw4xhnyg00bs11ej2mi7cd4y	cmw4xhnye00bq11ejoar1ii7b	NGT-06F-2628	80	120	175	0	2026-04-30 00:00:00	2028-04-30 00:00:00	APPROVED	2026-11-06 12:06:01.097
cmw4xhnym00bv11ej09esedlu	cmw4xhnyj00bt11ejb79erurc	PES-25S-2629	20	1200	1650	0	2027-12-31 00:00:00	2029-12-31 00:00:00	APPROVED	2026-11-06 12:06:01.102
cmw4xhnys00by11ejtfcl3fsq	cmw4xhnyq00bw11ej1w9ecfuk	SUT-CAT-2630	96	230	310	0	2026-09-30 00:00:00	2028-09-30 00:00:00	APPROVED	2026-11-06 12:06:01.109
cmw4xhnyy00c111ejhtqgbwlb	cmw4xhnyw00bz11ej0l6jolg0	SUT-CAT-2631	96	240	320	0	2026-09-30 00:00:00	2028-09-30 00:00:00	APPROVED	2026-11-06 12:06:01.115
cmw4xhnz400c411ejrbxwaph3	cmw4xhnz100c211ejrdu3lnuw	SUT-SLK-2632	120	190	260	0	2027-03-31 00:00:00	2029-03-31 00:00:00	APPROVED	2026-11-06 12:06:01.12
cmw4xhnz900c711ejdz0fmhr5	cmw4xhnz700c511ejv2794r9w	SUT-VIC-2633	120	420	560	0	2026-11-30 00:00:00	2028-11-30 00:00:00	APPROVED	2026-11-06 12:06:01.126
cmw4xhnze00ca11ejnrt5j06c	cmw4xhnzc00c811ejeh1u5bvz	SUT-VIC-2634	120	420	560	0	2026-11-30 00:00:00	2028-11-30 00:00:00	APPROVED	2026-11-06 12:06:01.13
cmw4xhnzj00cd11ejz82cjbw4	cmw4xhnzg00cb11ejavzvcgzl	SUT-PRO-2635	72	330	440	0	2026-12-31 00:00:00	2028-12-31 00:00:00	APPROVED	2026-11-06 12:06:01.136
cmw4xhnzp00cg11ejj3pa66jr	cmw4xhnzm00ce11ej2wtqawor	SUT-PRO-2636	72	340	460	0	2026-12-31 00:00:00	2028-12-31 00:00:00	APPROVED	2026-11-06 12:06:01.141
cmw4xhnzw00cj11ejc3030zua	cmw4xhnzs00ch11ejf41w3awl	SKN-STP-2637	30	700	950	0	2026-10-31 00:00:00	2028-10-31 00:00:00	APPROVED	2026-11-06 12:06:01.148
cmw4xho0300cm11ej397lt7fp	cmw4xho0000ck11ej4uwcx1w2	SPN-25G-2638	100	180	260	0	2026-06-30 00:00:00	2028-06-30 00:00:00	APPROVED	2026-11-06 12:06:01.156
cmw4xho0900cp11ejz6c8uthp	cmw4xho0600cn11ejvk8hgx1k	SPG-STD-2639	40	650	880	0	2026-03-31 00:00:00	2028-03-31 00:00:00	APPROVED	2026-11-06 12:06:01.161
cmw4xho0g00cs11ej6pdz35fu	cmw4xho0d00cq11ej4smqddd4	SUC-YNK-2640	80	320	440	0	2026-12-31 00:00:00	2028-12-31 00:00:00	APPROVED	2026-11-06 12:06:01.168
cmw4xho0l00cv11ejicdoiu3a	cmw4xho0i00ct11ejtlpa7veo	BLD-NO1-2641	1000	18	30	0	2027-06-30 00:00:00	2029-06-30 00:00:00	APPROVED	2026-11-06 12:06:01.173
cmw4xho0r00cy11ejzd93xmkh	cmw4xho0o00cw11ejvyrjh7kp	GLV-65C-2642	500	75	110	0	2026-05-31 00:00:00	2028-05-31 00:00:00	APPROVED	2026-11-06 12:06:01.179
cmw4xho0x00d111ejk83aedt7	cmw4xho0u00cz11ejy9400wee	GLV-70C-2643	750	75	110	0	2026-05-31 00:00:00	2028-05-31 00:00:00	APPROVED	2026-11-06 12:06:01.186
cmw4xho1400d411ej4uz7rqgt	cmw4xho1100d211ejgnpx5qkg	GLV-75C-2644	600	75	110	0	2026-05-31 00:00:00	2028-05-31 00:00:00	APPROVED	2026-11-06 12:06:01.192
cmw4xho1a00d711ej4l215m3p	cmw4xho1800d511ejal5kobgf	URN-2KL-2645	200	95	145	0	2026-11-30 00:00:00	2028-11-30 00:00:00	APPROVED	2026-11-06 12:06:01.198
cmw4xho1k00dd11ejtqqzolc1	cmw4xho1i00db11ejfbkx1vi7	ACEF-26002	900	134	171	0	2027-07-28 00:00:00	2029-07-28 00:00:00	APPROVED	2026-11-06 12:06:01.209
cmw4xho1q00dg11ejtgq6neqp	cmw4xho1n00de11ejwhxjpvug	ACTI-26003	100	63.9	83.07	0	2025-10-28 00:00:00	2027-10-28 00:00:00	APPROVED	2026-11-06 12:06:01.214
cmw4xho1v00dj11ej7ev4us8c	cmw4xho1s00dh11ej7cz72rz9	ADAB-26004	15	224	291.2	0	2026-01-28 00:00:00	2028-01-28 00:00:00	APPROVED	2026-11-06 12:06:01.219
cmw4xho2000dm11ej0ily34kn	cmw4xho1y00dk11ejs9pjuqpm	ADRE-26005	50	89	120.15	0	2027-04-28 00:00:00	2029-04-28 00:00:00	APPROVED	2026-11-06 12:06:01.225
cmw4xho2600dp11ejhajd7ne2	cmw4xho2300dn11ejqdye179e	AGVO-26006	1000	13	17	0	2025-07-28 00:00:00	2027-07-28 00:00:00	APPROVED	2026-11-06 12:06:01.23
cmw4xho2b00ds11ejwt3kg2pc	cmw4xho2900dq11ejza3vrsmr	ALAG-26007	20	169	216.32	0	2026-10-28 00:00:00	2028-10-28 00:00:00	APPROVED	2026-11-06 12:06:01.236
cmw4xhnu2009p11ej6fgsm5zn	cmw4xhntz009n11ej755emm12	SYR-10C-2603	350	28	38	0	2026-08-31 00:00:00	2028-08-31 00:00:00	APPROVED	2026-11-06 12:06:00.938
cmw4xhntw009m11ej5qiktksb	cmw4xhntt009k11ejtxgg2441	SYR-5CC-2602	1000	17	25	0	2026-06-30 00:00:00	2028-06-30 00:00:00	APPROVED	2026-11-06 12:06:00.932
cmw4xho2n00e111ejp7eeyspe	cmw4xho2l00dz11ejyb61dm6k	AMIN-26010	50	108	145.8	0	2026-07-28 00:00:00	2028-07-28 00:00:00	APPROVED	2026-11-06 12:06:01.247
cmw4xho2r00e411ejh7x82qbv	cmw4xho2p00e211ej67etbmco	ANNV-26011	20	197	252.16	0	2027-10-28 00:00:00	2029-10-28 00:00:00	APPROVED	2026-11-06 12:06:01.251
cmw4xho2v00e711ejrxsp09cm	cmw4xho2t00e511ejva58nf59	ANSA-26012	300	16	21.6	0	2025-01-28 00:00:00	2027-01-28 00:00:00	APPROVED	2026-11-06 12:06:01.255
cmw4xho2y00ea11ej890ocu06	cmw4xho2w00e811ej8hon4yv7	AQUA-26013	20	211	270.08	0	2026-04-28 00:00:00	2028-04-28 00:00:00	APPROVED	2026-11-06 12:06:01.259
cmw4xho3200ed11ej4oxs6pwt	cmw4xho3000eb11ejml3cfvd2	ASKO-26014	100	78.2	101.66	0	2027-07-28 00:00:00	2029-07-28 00:00:00	APPROVED	2026-11-06 12:06:01.263
cmw4xho3600eg11ejp0nltvz1	cmw4xho3400ee11ejnzzqbqpk	ATEM-26015	5	1105	1381.25	0	2025-10-28 00:00:00	2027-10-28 00:00:00	APPROVED	2026-11-06 12:06:01.267
cmw4xho3b00ej11ejj1yfv17w	cmw4xho3900eh11ejlda0domv	ATRO-26016	50	130.8	176.58	0	2026-01-28 00:00:00	2028-01-28 00:00:00	APPROVED	2026-11-06 12:06:01.271
cmw4xho3f00em11ejb9wkk3xh	cmw4xho3d00ek11ej0yosx0gx	AUGM-26017	20	239	305.92	0	2027-04-28 00:00:00	2029-04-28 00:00:00	APPROVED	2026-11-06 12:06:01.276
cmw4xho3k00ep11ejz8s6rrbu	cmw4xho3i00en11ejf2ptey4h	AUGM-26018	20	246	314.88	0	2025-07-28 00:00:00	2027-07-28 00:00:00	APPROVED	2026-11-06 12:06:01.28
cmw4xho3o00es11ejfwlxsc9d	cmw4xho3m00eq11eje539c5f3	AUGM-26019	20	253	323.84	0	2026-10-28 00:00:00	2028-10-28 00:00:00	APPROVED	2026-11-06 12:06:01.284
cmw4xho3s00ev11ejci0qzxuy	cmw4xho3q00et11ejg1md834i	AUGM-26020	300	20	27	0	2027-01-28 00:00:00	2029-01-28 00:00:00	APPROVED	2026-11-06 12:06:01.289
cmw4xho3z00ey11ejxcs48wqd	cmw4xho3w00ew11ejrfx6n6d8	AUGM-26021	300	20.5	27.68	0	2025-04-28 00:00:00	2027-04-28 00:00:00	APPROVED	2026-11-06 12:06:01.295
cmw4xho4400f111ejb0r32qi4	cmw4xho4200ez11ejr8058j80	AWAR-26022	300	21	28.35	0	2026-07-28 00:00:00	2028-07-28 00:00:00	APPROVED	2026-11-06 12:06:01.301
cmw4xho4g00f711ejufb8qx9k	cmw4xho4d00f511ejmp7pvg4l	AZOM-26024	300	22	29.7	0	2025-01-28 00:00:00	2027-01-28 00:00:00	APPROVED	2026-11-06 12:06:01.313
cmw4xho4n00fa11ejfyfzwr36	cmw4xho4k00f811ejyykh4ugg	AZOT-26025	300	22.5	30.38	0	2026-04-28 00:00:00	2028-04-28 00:00:00	APPROVED	2026-11-06 12:06:01.319
cmw4xho4s00fd11ejw6elfqxv	cmw4xho4q00fb11ejjh8uazwl	BCGV-26026	300	23	31.05	0	2027-07-28 00:00:00	2029-07-28 00:00:00	APPROVED	2026-11-06 12:06:01.325
cmw4xho4z00fg11ej0ricsyia	cmw4xho4v00fe11ej3sxq0ear	BIOF-26027	15	257	334.1	0	2025-10-28 00:00:00	2027-10-28 00:00:00	APPROVED	2026-11-06 12:06:01.332
cmw4xho5500fj11ejdx07lfks	cmw4xho5300fh11ejihydg1hw	BISL-26028	100	96.4	125.32	0	2026-01-28 00:00:00	2028-01-28 00:00:00	APPROVED	2026-11-06 12:06:01.338
cmw4xho5b00fm11ej2oaacw6v	cmw4xho5900fk11ejfs04r9s9	BOFA-26029	50	180.2	243.27	0	2027-04-28 00:00:00	2029-04-28 00:00:00	APPROVED	2026-11-06 12:06:01.344
cmw4xho5h00fp11ejx6hywtny	cmw4xho5f00fn11ej1foz81rx	BONE-26030	300	25	33.75	0	2025-07-28 00:00:00	2027-07-28 00:00:00	APPROVED	2026-11-06 12:06:01.35
cmw4xho5n00fs11ejrnzdunce	cmw4xho5k00fq11ej565z7o4i	BOVI-26031	300	25.5	34.43	0	2026-10-28 00:00:00	2028-10-28 00:00:00	APPROVED	2026-11-06 12:06:01.355
cmw4xho5t00fv11ej0966m6jn	cmw4xho5q00ft11ejy8087cwx	BREE-26032	300	26	35.1	0	2027-01-28 00:00:00	2029-01-28 00:00:00	APPROVED	2026-11-06 12:06:01.361
cmw4xho6000fy11ej3g5sdxz9	cmw4xho5w00fw11ejkbbsggrj	BROT-26033	300	26.5	35.78	0	2025-04-28 00:00:00	2027-04-28 00:00:00	APPROVED	2026-11-06 12:06:01.368
cmw4xho6500g111ej2gbcvifj	cmw4xho6300fz11ejrnhrp57f	BRUF-26034	20	178	227.84	0	2026-07-28 00:00:00	2028-07-28 00:00:00	APPROVED	2026-11-06 12:06:01.374
cmw4xho6b00g411ejbuzn7ilc	cmw4xho6900g211ejmwiy983g	BUPI-26035	50	203	274.05	0	2027-10-28 00:00:00	2029-10-28 00:00:00	APPROVED	2026-11-06 12:06:01.379
cmw4xho6f00g711ejjo9nqr31	cmw4xho6d00g511ej5v2p8oto	CAC1-26036	300	28	37.8	0	2025-01-28 00:00:00	2027-01-28 00:00:00	APPROVED	2026-11-06 12:06:01.383
cmw4xho6i00ga11ej22r0p5ae	cmw4xho6h00g811ejgj5zhl1d	CAES-26037	300	28.5	38.48	0	2026-04-28 00:00:00	2028-04-28 00:00:00	APPROVED	2026-11-06 12:06:01.387
cmw4xho6o00gd11ejk8fzt8u8	cmw4xho6l00gb11ejbccj7r53	CALA-26038	20	206	263.68	0	2027-07-28 00:00:00	2029-07-28 00:00:00	APPROVED	2026-11-06 12:06:01.392
cmw4xho6r00gg11ejio2hx65a	cmw4xho6q00ge11ej07o1mdxh	CALA-26039	50	218.2	294.57	0	2025-10-28 00:00:00	2027-10-28 00:00:00	APPROVED	2026-11-06 12:06:01.396
cmw4xho6v00gj11ej4zyiqmfz	cmw4xho6t00gh11ejh5b2ax9t	CALA-26040	300	30	40.5	0	2026-01-28 00:00:00	2028-01-28 00:00:00	APPROVED	2026-11-06 12:06:01.399
cmw4xho6z00gm11ejtlaefiso	cmw4xho6x00gk11ejed1kg85z	CALA-26041	300	30.5	41.18	0	2027-04-28 00:00:00	2029-04-28 00:00:00	APPROVED	2026-11-06 12:06:01.404
cmw4xho7400gp11ej5hgbrqrn	cmw4xho7200gn11ej2i16isgs	CALF-26042	300	31	41.85	0	2025-07-28 00:00:00	2027-07-28 00:00:00	APPROVED	2026-11-06 12:06:01.408
cmw4xho7800gs11ej71izm3qg	cmw4xho7600gq11ej4mvqpajv	CAMP-26043	50	73.4	99.09	0	2026-10-28 00:00:00	2028-10-28 00:00:00	APPROVED	2026-11-06 12:06:01.412
cmw4xho7b00gv11ej8vefxoj1	cmw4xho7900gt11ejv4sr4r17	CAPO-26044	300	10.33	13.95	0	2027-01-28 00:00:00	2029-01-28 00:00:00	APPROVED	2026-11-06 12:06:01.415
cmw4xho7f00gy11eju4yv13b2	cmw4xho7d00gw11ej35q5oupm	CAPO-26045	300	10.83	14.63	0	2025-04-28 00:00:00	2027-04-28 00:00:00	APPROVED	2026-11-06 12:06:01.419
cmw4xho7i00h111ejxmatlk8z	cmw4xho7h00gz11ej9cj7ok16	CEFI-26046	300	11.33	15.3	0	2026-07-28 00:00:00	2028-07-28 00:00:00	APPROVED	2026-11-06 12:06:01.423
cmw4xho7m00h411ejtge16li1	cmw4xho7l00h211ej7vlmxeou	CEFI-26047	20	269	344.32	0	2027-10-28 00:00:00	2029-10-28 00:00:00	APPROVED	2026-11-06 12:06:01.427
cmw4xho7q00h711ej10cbueso	cmw4xho7o00h511ej308dzqfd	CERE-26048	300	12.33	16.65	0	2025-01-28 00:00:00	2027-01-28 00:00:00	APPROVED	2026-11-06 12:06:01.431
cmw4xho7u00ha11ej8i04l72e	cmw4xho7s00h811ej7hktaz42	CERE-26049	300	12.83	17.33	0	2026-04-28 00:00:00	2028-04-28 00:00:00	APPROVED	2026-11-06 12:06:01.435
cmw4xho7z00hd11ej2vyattuw	cmw4xho7x00hb11ejua2ds5ga	CERE-26050	50	100	135	0	2027-07-28 00:00:00	2029-07-28 00:00:00	APPROVED	2026-11-06 12:06:01.439
cmw4xho8400hg11ej9pl5d1os	cmw4xho8200he11ejbc1l91tn	CIPR-26051	300	13.83	18.68	0	2025-10-28 00:00:00	2027-10-28 00:00:00	APPROVED	2026-11-06 12:06:01.444
cmw4xho8900hj11ej9rm2o4ik	cmw4xho8700hh11ejlwwq6ubf	CIPR-26052	300	14.33	19.35	0	2026-01-28 00:00:00	2028-01-28 00:00:00	APPROVED	2026-11-06 12:06:01.449
cmw4xho8e00hm11ejnbmc3gpo	cmw4xho8c00hk11ejosdigbfc	CITR-26053	20	131	167.68	0	2027-04-28 00:00:00	2029-04-28 00:00:00	APPROVED	2026-11-06 12:06:01.455
cmw4xho8j00hp11ejd0yonud2	cmw4xho8h00hn11ejc0t2nzsd	CLEN-26054	5	1268	1585	0	2025-07-28 00:00:00	2027-07-28 00:00:00	APPROVED	2026-11-06 12:06:01.46
cmw4xho8n00hs11ejzp708z0y	cmw4xho8l00hq11ej8fhsa668	CLIN-26055	15	345	448.5	0	2026-10-28 00:00:00	2028-10-28 00:00:00	APPROVED	2026-11-06 12:06:01.463
cmw4xho8r00hv11ej167byygw	cmw4xho8p00ht11ejchyntlvl	CLOM-26056	300	16.33	22.05	0	2027-01-28 00:00:00	2029-01-28 00:00:00	APPROVED	2026-11-06 12:06:01.467
cmw4xho8w00hy11ejdpm2qlfu	cmw4xho8u00hw11ej2s2kzyl7	CLYC-26057	15	367	477.1	0	2025-04-28 00:00:00	2027-04-28 00:00:00	APPROVED	2026-11-06 12:06:01.473
cmw4xho9300i111ejwr1gp9yz	cmw4xho9000hz11ej8uo6vz40	CMZN-26058	20	166	212.48	0	2026-07-28 00:00:00	2028-07-28 00:00:00	APPROVED	2026-11-06 12:06:01.479
cmw4xho9800i411ejqggabk6j	cmw4xho9600i211ejlvrrath0	CMZP-26059	20	173	221.44	0	2027-10-28 00:00:00	2029-10-28 00:00:00	APPROVED	2026-11-06 12:06:01.485
cmw4xho2j00dy11ejgxyrbk23	cmw4xho2h00dw11ejc6dzfklx	ALDO-26009	300	14.5	19.58	0	2025-04-28 00:00:00	2027-04-28 00:00:00	APPROVED	2026-11-06 12:06:01.243
cmw4xho9p00id11eja5lgk0ty	cmw4xho9m00ib11ej162755iu	COLI-26062	20	194	248.32	0	2027-07-28 00:00:00	2029-07-28 00:00:00	APPROVED	2026-11-06 12:06:01.501
cmw4xho9t00ig11ejdq95tvxz	cmw4xho9r00ie11ejvsx8kr3b	COLO-26063	100	61.9	80.47	0	2025-10-28 00:00:00	2027-10-28 00:00:00	APPROVED	2026-11-06 12:06:01.506
cmw4xho9x00ij11ejspm2wbuz	cmw4xho9v00ih11ej8kdmhmdg	COPE-26064	300	20.33	27.45	0	2026-01-28 00:00:00	2028-01-28 00:00:00	APPROVED	2026-11-06 12:06:01.51
cmw4xhoa300im11ejjiqmwtkr	cmw4xhoa100ik11eju0fpazka	CORE-26065	300	20.83	28.13	0	2027-04-28 00:00:00	2029-04-28 00:00:00	APPROVED	2026-11-06 12:06:01.515
cmw4xhoa900ip11ej6g4qvpqq	cmw4xhoa600in11ej0nfql5wa	CORE-26066	300	21.33	28.8	0	2025-07-28 00:00:00	2027-07-28 00:00:00	APPROVED	2026-11-06 12:06:01.521
cmw4xhoad00is11ejxkpa3knh	cmw4xhoab00iq11ej45yicjdf	CRAN-26067	100	67.1	87.23	0	2026-10-28 00:00:00	2028-10-28 00:00:00	APPROVED	2026-11-06 12:06:01.526
cmw4xhoai00iv11ejvsxi9ras	cmw4xhoag00it11ejp5dpq46i	CRAN-26068	100	68.4	88.92	0	2027-01-28 00:00:00	2029-01-28 00:00:00	APPROVED	2026-11-06 12:06:01.53
cmw4xhoan00iy11ejjs8qavy5	cmw4xhoak00iw11ejrkan1dc3	CYCL-26069	300	22.83	30.82	0	2025-04-28 00:00:00	2027-04-28 00:00:00	APPROVED	2026-11-06 12:06:01.536
cmw4xhoat00j111ej9h90rcl8	cmw4xhoaq00iz11ej7mkm7tro	CYPR-26070	300	23.33	31.5	0	2026-07-28 00:00:00	2028-07-28 00:00:00	APPROVED	2026-11-06 12:06:01.541
cmw4xhoaw00j411ej4m22hior	cmw4xhoau00j211ejtaoc79hy	CYTO-26071	300	23.83	32.17	0	2027-10-28 00:00:00	2029-10-28 00:00:00	APPROVED	2026-11-06 12:06:01.544
cmw4xhob000j711ejq9oitmy7	cmw4xhoay00j511ejw8c05hqc	DWIS-26072	100	73.6	95.68	0	2025-01-28 00:00:00	2027-01-28 00:00:00	APPROVED	2026-11-06 12:06:01.548
cmw4xhob400ja11ejr1pzz1bx	cmw4xhob200j811ejx3a9bagt	DAFL-26073	300	24.83	33.52	0	2026-04-28 00:00:00	2028-04-28 00:00:00	APPROVED	2026-11-06 12:06:01.553
cmw4xhob900jd11ejbfyyv28e	cmw4xhob700jb11ej1vl67dnl	DAIN-26074	300	25.33	34.2	0	2027-07-28 00:00:00	2029-07-28 00:00:00	APPROVED	2026-11-06 12:06:01.558
cmw4xhobl00jj11ej5ukepzq4	cmw4xhobi00jh11ejzsyncu30	DAYL-26076	50	198.8	268.38	0	2026-01-28 00:00:00	2028-01-28 00:00:00	APPROVED	2026-11-06 12:06:01.569
cmw4xhobq00jm11ejqnp47s2w	cmw4xhobo00jk11ejs3ctukfb	DECA-26077	50	202.6	273.51	0	2027-04-28 00:00:00	2029-04-28 00:00:00	APPROVED	2026-11-06 12:06:01.574
cmw4xhobv00jp11ej3agfn3i1	cmw4xhobt00jn11ejte1kdjew	DECA-26078	20	126	161.28	0	2025-07-28 00:00:00	2027-07-28 00:00:00	APPROVED	2026-11-06 12:06:01.579
cmw4xhoc000js11ej931x42kn	cmw4xhobx00jq11ej7agza9vn	DELI-26079	100	82.7	107.51	0	2026-10-28 00:00:00	2028-10-28 00:00:00	APPROVED	2026-11-06 12:06:01.584
cmw4xhoc600jv11ejhbun8dq9	cmw4xhoc400jt11ejlsrziloc	DEPI-26080	300	28.33	38.25	0	2027-01-28 00:00:00	2029-01-28 00:00:00	APPROVED	2026-11-06 12:06:01.591
cmw4xhocb00jy11ejimhjtqob	cmw4xhoc900jw11ejg8wmip7p	DEXA-26081	50	217.8	294.03	0	2025-04-28 00:00:00	2027-04-28 00:00:00	APPROVED	2026-11-06 12:06:01.595
cmw4xhocg00k111ej82mm57a4	cmw4xhoce00jz11ejlz4mtg06	DICL-26082	300	29.33	39.6	0	2026-07-28 00:00:00	2028-07-28 00:00:00	APPROVED	2026-11-06 12:06:01.6
cmw4xhocm00k411ejc1fwkak2	cmw4xhocj00k211ejk1oultnh	DICL-26083	300	29.83	40.27	0	2027-10-28 00:00:00	2029-10-28 00:00:00	APPROVED	2026-11-06 12:06:01.606
cmw4xhocq00k711ejlr5hvg1n	cmw4xhoco00k511ejggqv189n	DIGA-26084	20	168	215.04	0	2025-01-28 00:00:00	2027-01-28 00:00:00	APPROVED	2026-11-06 12:06:01.61
cmw4xhocv00ka11ejrfdl083c	cmw4xhoct00k811ejfwf3ll92	DIJE-26085	20	175	224	0	2026-04-28 00:00:00	2028-04-28 00:00:00	APPROVED	2026-11-06 12:06:01.615
cmw4xhod200kd11ejdzlw2wn7	cmw4xhod000kb11ej09gmfpg5	DORM-26086	50	76.8	103.68	0	2027-07-28 00:00:00	2029-07-28 00:00:00	APPROVED	2026-11-06 12:06:01.622
cmw4xhod600kg11ej6hxlqjj7	cmw4xhod400ke11ej9rymutuo	DSAV-26087	100	93.1	121.03	0	2025-10-28 00:00:00	2027-10-28 00:00:00	APPROVED	2026-11-06 12:06:01.626
cmw4xhoda00kj11ej1q3z40yc	cmw4xhod800kh11ej5au2tt8j	DUFE-26088	300	10.67	14.4	0	2026-01-28 00:00:00	2028-01-28 00:00:00	APPROVED	2026-11-06 12:06:01.63
cmw4xhode00km11eji8tdu78c	cmw4xhodc00kk11ejeoea2qgq	DUPH-26089	20	203	259.84	0	2027-04-28 00:00:00	2029-04-28 00:00:00	APPROVED	2026-11-06 12:06:01.635
cmw4xhodk00kp11eju2i1bsud	cmw4xhodi00kn11ejq62mfp8w	DUPH-26090	300	11.67	15.75	0	2025-07-28 00:00:00	2027-07-28 00:00:00	APPROVED	2026-11-06 12:06:01.641
cmw4xhodo00ks11ejavvhob6s	cmw4xhodm00kq11ejdtwqruml	DYDR-26091	300	12.17	16.43	0	2026-10-28 00:00:00	2028-10-28 00:00:00	APPROVED	2026-11-06 12:06:01.644
cmw4xhods00kv11ejwrfp9jax	cmw4xhodq00kt11ejdl4vef73	DYSE-26092	300	12.67	17.1	0	2027-01-28 00:00:00	2029-01-28 00:00:00	APPROVED	2026-11-06 12:06:01.648
cmw4xhodx00ky11ejsvcw0je7	cmw4xhodu00kw11ejxfsg565j	DYST-26093	300	13.17	17.78	0	2025-04-28 00:00:00	2027-04-28 00:00:00	APPROVED	2026-11-06 12:06:01.653
cmw4xhoe100l111ejk1gfm8kx	cmw4xhodz00kz11ejqvj4i8c7	ECOM-26094	300	13.67	18.45	0	2026-07-28 00:00:00	2028-07-28 00:00:00	APPROVED	2026-11-06 12:06:01.657
cmw4xhoe400l411ej1zled7rt	cmw4xhoe300l211ej9psvu53t	EMA-26095	300	14.17	19.13	0	2027-10-28 00:00:00	2029-10-28 00:00:00	APPROVED	2026-11-06 12:06:01.661
cmw4xhoe800l711ejkakik0rv	cmw4xhoe600l511ejpgprtnry	ENFL-26096	100	64.8	84.24	0	2025-01-28 00:00:00	2027-01-28 00:00:00	APPROVED	2026-11-06 12:06:01.665
cmw4xhoec00la11ejjkd4iyd2	cmw4xhoea00l811ejjwhb8lc9	ERYT-26097	300	15.17	20.48	0	2026-04-28 00:00:00	2028-04-28 00:00:00	APPROVED	2026-11-06 12:06:01.669
cmw4xhoeh00ld11ejcf4slp22	cmw4xhoef00lb11ejmr4ftfdt	ESLO-26098	300	15.67	21.15	0	2027-07-28 00:00:00	2029-07-28 00:00:00	APPROVED	2026-11-06 12:06:01.673
cmw4xhoek00lg11ejuws6ak22	cmw4xhoei00le11ejnhcejo44	ESOW-26099	300	16.17	21.83	0	2025-10-28 00:00:00	2027-10-28 00:00:00	APPROVED	2026-11-06 12:06:01.677
cmw4xhoeo00lj11ejh6j2w6ib	cmw4xhoem00lh11ej9d70cnhw	EVIO-26100	300	16.67	22.5	0	2026-01-28 00:00:00	2028-01-28 00:00:00	APPROVED	2026-11-06 12:06:01.681
cmw4xhoet00lm11ej5al28kze	cmw4xhoeq00lk11ejpx1wtnuf	FAMI-26101	50	133.8	180.63	0	2027-04-28 00:00:00	2029-04-28 00:00:00	APPROVED	2026-11-06 12:06:01.686
cmw4xhoey00lp11ejuf3b0rp4	cmw4xhoew00ln11ej16ldqwn1	FAMI-26102	300	17.67	23.85	0	2025-07-28 00:00:00	2027-07-28 00:00:00	APPROVED	2026-11-06 12:06:01.691
cmw4xhof300ls11ej7kw07c2p	cmw4xhof100lq11ej27fk7mzn	FAMO-26103	300	18.17	24.53	0	2026-10-28 00:00:00	2028-10-28 00:00:00	APPROVED	2026-11-06 12:06:01.696
cmw4xhof900lv11ejgv3j1yag	cmw4xhof600lt11ej18ormqzz	FAMO-26104	300	18.67	25.2	0	2027-01-28 00:00:00	2029-01-28 00:00:00	APPROVED	2026-11-06 12:06:01.701
cmw4xhofe00ly11ejbcuxtdxr	cmw4xhofb00lw11ejawatbhsw	FANT-26105	300	19.17	25.88	0	2025-04-28 00:00:00	2027-04-28 00:00:00	APPROVED	2026-11-06 12:06:01.706
cmw4xhofj00m111ejhbd8oxvu	cmw4xhofg00lz11ejqaqe82h8	FEFA-26106	300	19.67	26.55	0	2026-07-28 00:00:00	2028-07-28 00:00:00	APPROVED	2026-11-06 12:06:01.711
cmw4xhofp00m411eji7r9xcmz	cmw4xhofm00m211ejm963qu5f	FEFO-26107	300	20.17	27.23	0	2027-10-28 00:00:00	2029-10-28 00:00:00	APPROVED	2026-11-06 12:06:01.717
cmw4xhofv00m711ejz8yca3lq	cmw4xhofs00m511ejpuaj6pwy	FEMI-26108	20	156	199.68	0	2025-01-28 00:00:00	2027-01-28 00:00:00	APPROVED	2026-11-06 12:06:01.723
cmw4xhog100ma11ej91jehju7	cmw4xhofy00m811ejb4jdboaa	FERC-26109	300	21.17	28.58	0	2026-04-28 00:00:00	2028-04-28 00:00:00	APPROVED	2026-11-06 12:06:01.729
cmw4xhog800md11ej7aj318ky	cmw4xhog400mb11ejgdguj3wf	FERF-26110	20	170	217.6	0	2027-07-28 00:00:00	2029-07-28 00:00:00	APPROVED	2026-11-06 12:06:01.737
cmw4xhogd00mg11ej68i2huf0	cmw4xhogb00me11ejfvuseq1a	FERF-26111	300	22.17	29.93	0	2025-10-28 00:00:00	2027-10-28 00:00:00	APPROVED	2026-11-06 12:06:01.742
cmw4xho9j00ia11ejn7r4smo8	cmw4xho9g00i811ejco4hfio3	COFE-26061	20	187	239.36	0	2026-04-28 00:00:00	2028-04-28 00:00:00	APPROVED	2026-11-06 12:06:01.495
cmw4xhogr00mp11ejjvye9h77	cmw4xhogp00mn11ejjnrcym08	FERT-26114	100	88.2	114.66	0	2025-07-28 00:00:00	2027-07-28 00:00:00	APPROVED	2026-11-06 12:06:01.756
cmw4xhogv00ms11ej1r9bwv1k	cmw4xhogt00mq11ejo6hnx9dj	FERT-26115	50	187	252.45	0	2026-10-28 00:00:00	2028-10-28 00:00:00	APPROVED	2026-11-06 12:06:01.76
cmw4xhogz00mv11ejeq6zbkw6	cmw4xhogx00mt11ejkybwr19z	FERT-26116	50	190.8	257.58	0	2027-01-28 00:00:00	2029-01-28 00:00:00	APPROVED	2026-11-06 12:06:01.764
cmw4xhoh300my11eja8bywy19	cmw4xhoh100mw11ejm45eamb4	FERT-26117	300	25.17	33.98	0	2025-04-28 00:00:00	2027-04-28 00:00:00	APPROVED	2026-11-06 12:06:01.768
cmw4xhoh800n111ejg0bgrh8q	cmw4xhoh500mz11ejxlgbw1l3	FERV-26118	300	25.67	34.65	0	2026-07-28 00:00:00	2028-07-28 00:00:00	APPROVED	2026-11-06 12:06:01.772
cmw4xhohc00n411ejcpgje0fs	cmw4xhoha00n211ejns304f2h	FIBR-26119	100	94.7	123.11	0	2027-10-28 00:00:00	2029-10-28 00:00:00	APPROVED	2026-11-06 12:06:01.777
cmw4xhohg00n711eja81gaul5	cmw4xhohf00n511ejqrfb3yhh	FIXI-26120	300	26.67	36	0	2025-01-28 00:00:00	2027-01-28 00:00:00	APPROVED	2026-11-06 12:06:01.781
cmw4xhohl00na11ejhq83ud5s	cmw4xhohj00n811ejavrpfr13	FLYG-26121	300	27.17	36.68	0	2026-04-28 00:00:00	2028-04-28 00:00:00	APPROVED	2026-11-06 12:06:01.785
cmw4xhohp00nd11ejnjxspesb	cmw4xhohn00nb11ej2wziopcm	FLYG-26122	50	213.6	288.36	0	2027-07-28 00:00:00	2029-07-28 00:00:00	APPROVED	2026-11-06 12:06:01.79
cmw4xhohw00ng11ejsedowivz	cmw4xhohs00ne11ej8emg6r34	FOLI-26123	300	28.17	38.03	0	2025-10-28 00:00:00	2027-10-28 00:00:00	APPROVED	2026-11-06 12:06:01.796
cmw4xhoi100nj11ejx8gqsce1	cmw4xhohy00nh11ej6glir6hu	FORT-26124	300	28.67	38.7	0	2026-01-28 00:00:00	2028-01-28 00:00:00	APPROVED	2026-11-06 12:06:01.801
cmw4xhoi500nm11ej8lnua862	cmw4xhoi300nk11ejledhrduy	FREC-26125	100	62.5	81.25	0	2027-04-28 00:00:00	2029-04-28 00:00:00	APPROVED	2026-11-06 12:06:01.805
cmw4xhoi900np11ejxsbslexn	cmw4xhoi700nn11ej1fbu628d	FUDI-26126	15	246	319.8	0	2025-07-28 00:00:00	2027-07-28 00:00:00	APPROVED	2026-11-06 12:06:01.809
cmw4xhoii00nv11ej4psrszqy	cmw4xhoie00nt11ejbtbh9alg	GETR-26128	300	30.67	41.4	0	2027-01-28 00:00:00	2029-01-28 00:00:00	APPROVED	2026-11-06 12:06:01.818
cmw4xhoio00ny11ejwpqcxlvf	cmw4xhoik00nw11ejcidi5g8e	GLAN-26129	15	279	362.7	0	2025-04-28 00:00:00	2027-04-28 00:00:00	APPROVED	2026-11-06 12:06:01.824
cmw4xhoiu00o111ejwljhvx27	cmw4xhoir00nz11ejjrb9f1sl	GLUC-26130	300	10	13.5	0	2026-07-28 00:00:00	2028-07-28 00:00:00	APPROVED	2026-11-06 12:06:01.83
cmw4xhoiy00o411ejh9txudz2	cmw4xhoiw00o211ejsebsq78r	GLYC-26131	20	137	175.36	0	2027-10-28 00:00:00	2029-10-28 00:00:00	APPROVED	2026-11-06 12:06:01.834
cmw4xhoj100o711ejy6imdjwo	cmw4xhoiz00o511ej5oik9j4n	GRAV-26132	50	91.6	123.66	0	2025-01-28 00:00:00	2027-01-28 00:00:00	APPROVED	2026-11-06 12:06:01.838
cmw4xhoj500oa11ejop7f2dwh	cmw4xhoj300o811ej7l6cixfq	GRAV-26133	50	95.4	128.79	0	2026-04-28 00:00:00	2028-04-28 00:00:00	APPROVED	2026-11-06 12:06:01.842
cmw4xhoj900od11ejiczzu5nw	cmw4xhoj700ob11ejc7gmj8ok	GTN-26134	300	12	16.2	0	2027-07-28 00:00:00	2029-07-28 00:00:00	APPROVED	2026-11-06 12:06:01.846
cmw4xhojd00og11eju1vib2fz	cmw4xhojb00oe11eji5y9j99v	GYNO-26135	300	12.5	16.88	0	2025-10-28 00:00:00	2027-10-28 00:00:00	APPROVED	2026-11-06 12:06:01.85
cmw4xhojh00oj11ejqh9pnot3	cmw4xhojf00oh11ej6inj7lpz	GYNO-26136	100	76.8	99.84	0	2026-01-28 00:00:00	2028-01-28 00:00:00	APPROVED	2026-11-06 12:06:01.854
cmw4xhojm00om11ej8l2vho9a	cmw4xhojk00ok11ejnngn8a8u	HAEM-26137	50	110.6	149.31	0	2027-04-28 00:00:00	2029-04-28 00:00:00	APPROVED	2026-11-06 12:06:01.858
cmw4xhojq00op11ej8ovaie3f	cmw4xhojo00on11ejqbcqxrmw	HEAL-26138	15	378	491.4	0	2025-07-28 00:00:00	2027-07-28 00:00:00	APPROVED	2026-11-06 12:06:01.862
cmw4xhoju00os11ej7d3s7h6r	cmw4xhojs00oq11ejy34imaui	HICA-26139	300	14.5	19.58	0	2026-10-28 00:00:00	2028-10-28 00:00:00	APPROVED	2026-11-06 12:06:01.867
cmw4xhojy00ov11ejzbnl6mfl	cmw4xhojw00ot11ej24s15pkl	HIVI-26140	300	15	20.25	0	2027-01-28 00:00:00	2029-01-28 00:00:00	APPROVED	2026-11-06 12:06:01.87
cmw4xhok100oy11eja0co02gk	cmw4xhok000ow11ejghhi45hz	HIZO-26141	50	125.8	169.83	0	2025-04-28 00:00:00	2027-04-28 00:00:00	APPROVED	2026-11-06 12:06:01.874
cmw4xhok600p111ej0yi61pg7	cmw4xhok400oz11ejnxza7vj3	HYDR-26142	50	129.6	174.96	0	2026-07-28 00:00:00	2028-07-28 00:00:00	APPROVED	2026-11-06 12:06:01.878
cmw4xhok900p411ejf4no7oj3	cmw4xhok700p211ejq7m27uxv	HYDR-26143	15	213	276.9	0	2027-10-28 00:00:00	2029-10-28 00:00:00	APPROVED	2026-11-06 12:06:01.882
cmw4xhokd00p711ejxie05vyt	cmw4xhokb00p511ej6ws6mdvi	HYDR-26144	20	228	291.84	0	2025-01-28 00:00:00	2027-01-28 00:00:00	APPROVED	2026-11-06 12:06:01.886
cmw4xhokh00pa11ej8wksq37m	cmw4xhokf00p811ej6hkxmaq4	HYDR-26145	20	235	300.8	0	2026-04-28 00:00:00	2028-04-28 00:00:00	APPROVED	2026-11-06 12:06:01.889
cmw4xhokl00pd11ejvg4d3w60	cmw4xhokj00pb11ejbphisugk	HYZO-26146	50	144.8	195.48	0	2027-07-28 00:00:00	2029-07-28 00:00:00	APPROVED	2026-11-06 12:06:01.893
cmw4xhoko00pg11ej73ktsb8x	cmw4xhokm00pe11ejmc9zjdth	IBER-26147	300	18.5	24.98	0	2025-10-28 00:00:00	2027-10-28 00:00:00	APPROVED	2026-11-06 12:06:01.896
cmw4xhoks00pj11ejsywmhbu3	cmw4xhokq00ph11ejfu5er7pu	ICON-26148	300	19	25.65	0	2026-01-28 00:00:00	2028-01-28 00:00:00	APPROVED	2026-11-06 12:06:01.9
cmw4xhokx00pm11ej4p90d9vl	cmw4xhoku00pk11ejz4ehbfiq	IMAT-26149	50	156.2	210.87	0	2027-04-28 00:00:00	2029-04-28 00:00:00	APPROVED	2026-11-06 12:06:01.905
cmw4xhol200pp11ejy0s329hj	cmw4xhol000pn11ej9325tjh6	INDE-26150	300	20	27	0	2025-07-28 00:00:00	2027-07-28 00:00:00	APPROVED	2026-11-06 12:06:01.91
cmw4xhol600ps11ej6ooi5i1b	cmw4xhol400pq11ej92ms4ieh	INVE-26151	20	277	354.56	0	2026-10-28 00:00:00	2028-10-28 00:00:00	APPROVED	2026-11-06 12:06:01.915
cmw4xhola00pv11ejqxcplg2c	cmw4xhol800pt11ejfgabmrbz	IRAX-26152	300	21	28.35	0	2027-01-28 00:00:00	2029-01-28 00:00:00	APPROVED	2026-11-06 12:06:01.918
cmw4xhole00py11ej8d10iwqd	cmw4xholc00pw11ejexd6anbi	IROF-26153	100	98.9	128.57	0	2025-04-28 00:00:00	2027-04-28 00:00:00	APPROVED	2026-11-06 12:06:01.923
cmw4xholi00q111ej0c59572p	cmw4xholg00pz11ejs345lv1u	IRON-26154	100	60.2	78.26	0	2026-07-28 00:00:00	2028-07-28 00:00:00	APPROVED	2026-11-06 12:06:01.927
cmw4xholm00q411ejw1rnn3wx	cmw4xholk00q211ej8gip79om	IROS-26155	50	179	241.65	0	2027-10-28 00:00:00	2029-10-28 00:00:00	APPROVED	2026-11-06 12:06:01.93
cmw4xholq00q711eji0sd53ip	cmw4xholo00q511ejlelroafx	KCLA-26156	300	23	31.05	0	2025-01-28 00:00:00	2027-01-28 00:00:00	APPROVED	2026-11-06 12:06:01.935
cmw4xholv00qa11ej9tcj8hux	cmw4xholt00q811ejriwt0wr8	KEST-26157	300	23.5	31.73	0	2026-04-28 00:00:00	2028-04-28 00:00:00	APPROVED	2026-11-06 12:06:01.94
cmw4xhom000qd11ejwlj45cjz	cmw4xholy00qb11ejrl8uqv1z	KETA-26158	50	190.4	257.04	0	2027-07-28 00:00:00	2029-07-28 00:00:00	APPROVED	2026-11-06 12:06:01.945
cmw4xhom300qg11ej4drrjfqv	cmw4xhom200qe11ej00ybzw9y	KETG-26159	50	194.2	262.17	0	2025-10-28 00:00:00	2027-10-28 00:00:00	APPROVED	2026-11-06 12:06:01.948
cmw4xhom700qj11ejlj9vpeqv	cmw4xhom500qh11ejap0mqug8	KIPO-26160	20	160	204.8	0	2026-01-28 00:00:00	2028-01-28 00:00:00	APPROVED	2026-11-06 12:06:01.952
cmw4xhomb00qm11ej0xdyn2b7	cmw4xhom900qk11ejjs7cquz9	KLOT-26161	50	201.8	272.43	0	2027-04-28 00:00:00	2029-04-28 00:00:00	APPROVED	2026-11-06 12:06:01.955
cmw4xhomf00qp11ejf3xae3az	cmw4xhomd00qn11ej8jhyop2b	LABE-26162	50	205.6	277.56	0	2025-07-28 00:00:00	2027-07-28 00:00:00	APPROVED	2026-11-06 12:06:01.959
cmw4xhomi00qs11ej7w5rctvc	cmw4xhomh00qq11ejrgbjq025	LACT-26163	300	26.5	35.78	0	2026-10-28 00:00:00	2028-10-28 00:00:00	APPROVED	2026-11-06 12:06:01.963
cmw4xhogn00mm11ej7idrw64l	cmw4xhogk00mk11ejrt9zqu0h	FERR-26113	300	23.17	31.28	0	2027-04-28 00:00:00	2029-04-28 00:00:00	APPROVED	2026-11-06 12:06:01.751
cmw4xhomw00r111ej2unejg5z	cmw4xhomu00qz11ej5rsxtxjb	LAXO-26166	300	28	37.8	0	2026-07-28 00:00:00	2028-07-28 00:00:00	APPROVED	2026-11-06 12:06:01.977
cmw4xhon000r411ej2lhzs7ay	cmw4xhomy00r211ej15u8ewby	LEBR-26167	300	28.5	38.48	0	2027-10-28 00:00:00	2029-10-28 00:00:00	APPROVED	2026-11-06 12:06:01.981
cmw4xhon400r711ejbob6aw4c	cmw4xhon200r511ejeryviylq	LEDE-26168	20	216	276.48	0	2025-01-28 00:00:00	2027-01-28 00:00:00	APPROVED	2026-11-06 12:06:01.985
cmw4xhon800ra11ejhdxnuu45	cmw4xhon600r811ejfbawguho	LEFL-26169	300	29.5	39.83	0	2026-04-28 00:00:00	2028-04-28 00:00:00	APPROVED	2026-11-06 12:06:01.988
cmw4xhonc00rd11ejjzpv3ffz	cmw4xhona00rb11ejmsolmgnm	LEFL-26170	300	30	40.5	0	2027-07-28 00:00:00	2029-07-28 00:00:00	APPROVED	2026-11-06 12:06:01.992
cmw4xhong00rg11ejvjmc8pju	cmw4xhone00re11ejlv7pn3b0	LEVO-26171	300	30.5	41.18	0	2025-10-28 00:00:00	2027-10-28 00:00:00	APPROVED	2026-11-06 12:06:01.997
cmw4xhonl00rj11ej7hfwu2hg	cmw4xhonj00rh11ej7eckyfrx	LEVO-26172	300	31	41.85	0	2026-01-28 00:00:00	2028-01-28 00:00:00	APPROVED	2026-11-06 12:06:02.002
cmw4xhonr00rm11ejvkx0t2iu	cmw4xhono00rk11ejrvglx9cj	LIQU-26173	20	251	321.28	0	2027-04-28 00:00:00	2029-04-28 00:00:00	APPROVED	2026-11-06 12:06:02.007
cmw4xhony00rp11ejw7tl7juu	cmw4xhonu00rn11ejsna3bk2e	LOCY-26174	100	86.2	112.06	0	2025-07-28 00:00:00	2027-07-28 00:00:00	APPROVED	2026-11-06 12:06:02.014
cmw4xhoo400rs11eji7pmuvgp	cmw4xhoo100rq11ejsloz6jgf	LOPR-26175	300	10.83	14.63	0	2026-10-28 00:00:00	2028-10-28 00:00:00	APPROVED	2026-11-06 12:06:02.02
cmw4xhoo900rv11ejkucnnfl7	cmw4xhoo600rt11ejsbtzogpi	LOPR-26176	300	11.33	15.3	0	2027-01-28 00:00:00	2029-01-28 00:00:00	APPROVED	2026-11-06 12:06:02.025
cmw4xhood00ry11ejmpsbri19	cmw4xhoob00rw11eji77o128w	LYSO-26177	20	279	357.12	0	2025-04-28 00:00:00	2027-04-28 00:00:00	APPROVED	2026-11-06 12:06:02.03
cmw4xhooj00s111ejg6zs5sue	cmw4xhoog00rz11ej4puclugs	MACA-26178	100	91.4	118.82	0	2026-07-28 00:00:00	2028-07-28 00:00:00	APPROVED	2026-11-06 12:06:02.035
cmw4xhoor00s711ejfy06frh5	cmw4xhoop00s511ejf2ookiwc	MAM2-26180	100	94	122.2	0	2025-01-28 00:00:00	2027-01-28 00:00:00	APPROVED	2026-11-06 12:06:02.043
cmw4xhoou00sa11ejbj56uipg	cmw4xhoos00s811ejxeb8ofbo	MAXE-26181	100	95.3	123.89	0	2026-04-28 00:00:00	2028-04-28 00:00:00	APPROVED	2026-11-06 12:06:02.047
cmw4xhooy00sd11ej4spy0a5o	cmw4xhoow00sb11ej6qismhcr	MAXO-26182	50	121.6	164.16	0	2027-07-28 00:00:00	2029-07-28 00:00:00	APPROVED	2026-11-06 12:06:02.051
cmw4xhop200sg11ej6semby5p	cmw4xhop000se11ejbezhcobr	MAXO-26183	300	14.83	20.03	0	2025-10-28 00:00:00	2027-10-28 00:00:00	APPROVED	2026-11-06 12:06:02.054
cmw4xhop600sj11ejbqbliq41	cmw4xhop400sh11ejj6s30vqx	MEBR-26184	300	15.33	20.7	0	2026-01-28 00:00:00	2028-01-28 00:00:00	APPROVED	2026-11-06 12:06:02.059
cmw4xhopa00sm11ejyvn65577	cmw4xhop800sk11ejwg63411u	METO-26185	300	15.83	21.38	0	2027-04-28 00:00:00	2029-04-28 00:00:00	APPROVED	2026-11-06 12:06:02.063
cmw4xhope00sp11ejn1vgqzw1	cmw4xhopc00sn11ejc0cl9gfv	MOMF-26186	300	16.33	22.05	0	2025-07-28 00:00:00	2027-07-28 00:00:00	APPROVED	2026-11-06 12:06:02.066
cmw4xhopj00ss11ejqfqapb24	cmw4xhoph00sq11ejzetfez98	MOSE-26187	20	169	216.32	0	2026-10-28 00:00:00	2028-10-28 00:00:00	APPROVED	2026-11-06 12:06:02.071
cmw4xhopo00sv11ejwaudd7af	cmw4xhopl00st11ej89tdy7bu	MOTI-26188	300	17.33	23.4	0	2027-01-28 00:00:00	2029-01-28 00:00:00	APPROVED	2026-11-06 12:06:02.076
cmw4xhops00sy11ejak5qaugm	cmw4xhopr00sw11ej67j1rkfh	MULT-26189	300	17.83	24.07	0	2025-04-28 00:00:00	2027-04-28 00:00:00	APPROVED	2026-11-06 12:06:02.081
cmw4xhopw00t111ejrrzhetuu	cmw4xhopu00sz11ejmawz5le8	MYCI-26190	15	290	377	0	2026-07-28 00:00:00	2028-07-28 00:00:00	APPROVED	2026-11-06 12:06:02.085
cmw4xhoq000t411ejsp61x8ps	cmw4xhopy00t211ejjpw0bt0l	MYOJ-26191	100	68.3	88.79	0	2027-10-28 00:00:00	2029-10-28 00:00:00	APPROVED	2026-11-06 12:06:02.089
cmw4xhoq400t711ejef4cqgfw	cmw4xhoq300t511ejgabvy2vj	NEUR-26192	50	159.6	215.46	0	2025-01-28 00:00:00	2027-01-28 00:00:00	APPROVED	2026-11-06 12:06:02.093
cmw4xhoq800ta11ejswgrkgvc	cmw4xhoq600t811ejwjqg315w	NEXU-26193	300	19.83	26.77	0	2026-04-28 00:00:00	2028-04-28 00:00:00	APPROVED	2026-11-06 12:06:02.096
cmw4xhoqb00td11ejo8mhbj76	cmw4xhoq900tb11ejot862ecx	NEZK-26194	300	20.33	27.45	0	2027-07-28 00:00:00	2029-07-28 00:00:00	APPROVED	2026-11-06 12:06:02.1
cmw4xhoqf00tg11ejh8kaztug	cmw4xhoqd00te11ej0l2mp0du	NIFE-26195	300	20.83	28.13	0	2025-10-28 00:00:00	2027-10-28 00:00:00	APPROVED	2026-11-06 12:06:02.104
cmw4xhoqj00tj11ejzyu90nvc	cmw4xhoqh00th11ejs395n00d	NIFE-26196	300	21.33	28.8	0	2026-01-28 00:00:00	2028-01-28 00:00:00	APPROVED	2026-11-06 12:06:02.108
cmw4xhoqn00tm11ejjphjz83t	cmw4xhoql00tk11ejknu1nfvc	NILS-26197	20	239	305.92	0	2027-04-28 00:00:00	2029-04-28 00:00:00	APPROVED	2026-11-06 12:06:02.111
cmw4xhoqq00tp11ejqmuuofn4	cmw4xhoqo00tn11ejfm8fvalt	NITR-26198	100	77.4	100.62	0	2025-07-28 00:00:00	2027-07-28 00:00:00	APPROVED	2026-11-06 12:06:02.115
cmw4xhoqv00ts11ej12zgznxm	cmw4xhoqt00tq11ejc0qcpayb	NORE-26199	300	22.83	30.82	0	2026-10-28 00:00:00	2028-10-28 00:00:00	APPROVED	2026-11-06 12:06:02.119
cmw4xhor000tv11eju5swxiyb	cmw4xhoqy00tt11ejx7orevga	NOSP-26200	300	23.33	31.5	0	2027-01-28 00:00:00	2029-01-28 00:00:00	APPROVED	2026-11-06 12:06:02.125
cmw4xhor400ty11ejl418a5xm	cmw4xhor200tw11ejjmhjgt7k	NOSP-26201	300	23.83	32.17	0	2025-04-28 00:00:00	2027-04-28 00:00:00	APPROVED	2026-11-06 12:06:02.128
cmw4xhor900u111ejhm9g8cje	cmw4xhor600tz11ejwbpbbcc7	NALB-26202	50	197.6	266.76	0	2026-07-28 00:00:00	2028-07-28 00:00:00	APPROVED	2026-11-06 12:06:02.133
cmw4xhore00u411ejll0x8i4i	cmw4xhorb00u211ejyjggc4zj	NUMI-26203	300	24.83	33.52	0	2027-10-28 00:00:00	2029-10-28 00:00:00	APPROVED	2026-11-06 12:06:02.138
cmw4xhorj00u711ejoq433vsf	cmw4xhorg00u511ejxpgf5ixc	OBSI-26204	100	85.2	110.76	0	2025-01-28 00:00:00	2027-01-28 00:00:00	APPROVED	2026-11-06 12:06:02.143
cmw4xhorn00ua11ejf88syyvc	cmw4xhorl00u811ejqhzmn9gl	ONEN-26205	300	25.83	34.88	0	2026-04-28 00:00:00	2028-04-28 00:00:00	APPROVED	2026-11-06 12:06:02.147
cmw4xhorr00ud11ejn0h1cqav	cmw4xhorp00ub11ejfuj9z9er	ORS-26206	100	87.8	114.14	0	2027-07-28 00:00:00	2029-07-28 00:00:00	APPROVED	2026-11-06 12:06:02.152
cmw4xhorv00ug11ejmai296nb	cmw4xhort00ue11ej1jqmazli	ORSL-26207	300	26.83	36.23	0	2025-10-28 00:00:00	2027-10-28 00:00:00	APPROVED	2026-11-06 12:06:02.155
cmw4xhorz00uj11ej26i7aggo	cmw4xhorx00uh11eji0ergn17	OSAM-26208	300	27.33	36.9	0	2026-01-28 00:00:00	2028-01-28 00:00:00	APPROVED	2026-11-06 12:06:02.16
cmw4xhos400um11ej5jf08pjq	cmw4xhos200uk11ej8ehtokzk	OSLI-26209	100	91.7	119.21	0	2027-04-28 00:00:00	2029-04-28 00:00:00	APPROVED	2026-11-06 12:06:02.164
cmw4xhos800up11ej57shwvzg	cmw4xhos600un11ej3eibgu07	OSSO-26210	300	28.33	38.25	0	2025-07-28 00:00:00	2027-07-28 00:00:00	APPROVED	2026-11-06 12:06:02.169
cmw4xhosd00us11ejr38esg6k	cmw4xhosb00uq11ejoaxz9van	OTTA-26211	300	28.83	38.93	0	2026-10-28 00:00:00	2028-10-28 00:00:00	APPROVED	2026-11-06 12:06:02.173
cmw4xhosi00uv11ejay29ezx7	cmw4xhosf00ut11ejcmil0vcx	OVAR-26212	100	95.6	124.28	0	2027-01-28 00:00:00	2029-01-28 00:00:00	APPROVED	2026-11-06 12:06:02.179
cmw4xhosm00uy11ejncheerx8	cmw4xhosk00uw11ejkjwysn5j	OXID-26213	50	79.4	107.19	0	2025-04-28 00:00:00	2027-04-28 00:00:00	APPROVED	2026-11-06 12:06:02.182
cmw4xhosq00v111ejcg7ix2p8	cmw4xhoso00uz11ejj1dwxn0d	OXID-26214	50	83.2	112.32	0	2026-07-28 00:00:00	2028-07-28 00:00:00	APPROVED	2026-11-06 12:06:02.186
cmw4xhosu00v411ejdw8j7b3c	cmw4xhoss00v211ejpp2mllms	OXID-26215	50	87	117.45	0	2027-10-28 00:00:00	2029-10-28 00:00:00	APPROVED	2026-11-06 12:06:02.19
cmw4xhoms00qy11ejrv62nnib	cmw4xhomp00qw11ej2p7taz3i	LAXO-26165	20	195	249.6	0	2025-04-28 00:00:00	2027-04-28 00:00:00	APPROVED	2026-11-06 12:06:01.972
cmw4xhot600vd11ejesgdd4fj	cmw4xhot400vb11ejaj5vy2ss	PANA-26218	20	206	263.68	0	2027-07-28 00:00:00	2029-07-28 00:00:00	APPROVED	2026-11-06 12:06:02.203
cmw4xhota00vg11eja6gvfrtg	cmw4xhot800ve11ej76lwsbgx	PANA-26219	50	102.2	137.97	0	2025-10-28 00:00:00	2027-10-28 00:00:00	APPROVED	2026-11-06 12:06:02.206
cmw4xhote00vj11ejhq6qbjvg	cmw4xhotc00vh11ejrbettg0d	PARA-26220	300	11.67	15.75	0	2026-01-28 00:00:00	2028-01-28 00:00:00	APPROVED	2026-11-06 12:06:02.21
cmw4xhotl00vm11ej8ujz3rfp	cmw4xhoti00vk11ej82rerfny	PEPS-26221	20	227	290.56	0	2027-04-28 00:00:00	2029-04-28 00:00:00	APPROVED	2026-11-06 12:06:02.217
cmw4xhotp00vp11ejz3daubjv	cmw4xhotn00vn11ejpitcc006	PERM-26222	300	12.67	17.1	0	2025-07-28 00:00:00	2027-07-28 00:00:00	APPROVED	2026-11-06 12:06:02.222
cmw4xhott00vs11ejvz1r8tr3	cmw4xhotr00vq11ejtgt7qftn	POLY-26223	300	13.17	17.78	0	2026-10-28 00:00:00	2028-10-28 00:00:00	APPROVED	2026-11-06 12:06:02.226
cmw4xhotx00vv11ejp0iqgehe	cmw4xhotv00vt11ejzjopiovu	PONS-26224	300	13.67	18.45	0	2027-01-28 00:00:00	2029-01-28 00:00:00	APPROVED	2026-11-06 12:06:02.229
cmw4xhou200vy11ej52aq4j4w	cmw4xhotz00vw11ejez5tmiw8	PONS-26225	300	14.17	19.13	0	2025-04-28 00:00:00	2027-04-28 00:00:00	APPROVED	2026-11-06 12:06:02.234
cmw4xhou600w111ej3c6wuric	cmw4xhou400vz11ej4wd8rmhu	PREG-26226	300	14.67	19.8	0	2026-07-28 00:00:00	2028-07-28 00:00:00	APPROVED	2026-11-06 12:06:02.239
cmw4xhoua00w411ejzajiga2j	cmw4xhou800w211ej9rzhv51p	PRIM-26227	100	75.1	97.63	0	2027-10-28 00:00:00	2029-10-28 00:00:00	APPROVED	2026-11-06 12:06:02.242
cmw4xhoue00w711ejg2z0140d	cmw4xhouc00w511ejmxw2msml	PRIM-26228	300	15.67	21.15	0	2025-01-28 00:00:00	2027-01-28 00:00:00	APPROVED	2026-11-06 12:06:02.246
cmw4xhoui00wa11ejhzcmog7l	cmw4xhoug00w811ejnc2nxszv	PREG-26229	300	16.17	21.83	0	2026-04-28 00:00:00	2028-04-28 00:00:00	APPROVED	2026-11-06 12:06:02.25
cmw4xhoum00wd11ej302s7fq2	cmw4xhouk00wb11ejw4gmora6	PROP-26230	50	144	194.4	0	2027-07-28 00:00:00	2029-07-28 00:00:00	APPROVED	2026-11-06 12:06:02.255
cmw4xhouv00wj11ejrts8xf0x	cmw4xhout00wh11ejnerv33nl	PUBE-26232	50	151.6	204.66	0	2026-01-28 00:00:00	2028-01-28 00:00:00	APPROVED	2026-11-06 12:06:02.263
cmw4xhouz00wm11ej2hlhxl9r	cmw4xhouw00wk11ejqu5gzfo4	QALS-26233	300	18.17	24.53	0	2027-04-28 00:00:00	2029-04-28 00:00:00	APPROVED	2026-11-06 12:06:02.267
cmw4xhov200wp11ejsjgrlgvh	cmw4xhov100wn11ej40hutl1v	QALS-26234	100	84.2	109.46	0	2025-07-28 00:00:00	2027-07-28 00:00:00	APPROVED	2026-11-06 12:06:02.271
cmw4xhov600ws11ej4q235utu	cmw4xhov400wq11ejk9a0x92y	QBAC-26235	50	163	220.05	0	2026-10-28 00:00:00	2028-10-28 00:00:00	APPROVED	2026-11-06 12:06:02.275
cmw4xhovc00wv11ejfzgjcosz	cmw4xhova00wt11ejl52gsm89	QBAC-26236	50	166.8	225.18	0	2027-01-28 00:00:00	2029-01-28 00:00:00	APPROVED	2026-11-06 12:06:02.28
cmw4xhovg00wy11ejcwl3qbw3	cmw4xhove00ww11ej5ojydik7	QICK-26237	20	159	203.52	0	2025-04-28 00:00:00	2027-04-28 00:00:00	APPROVED	2026-11-06 12:06:02.284
cmw4xhovj00x111ejuj30qahp	cmw4xhovi00wz11ejqh6u8317	QLIN-26238	300	20.67	27.9	0	2026-07-28 00:00:00	2028-07-28 00:00:00	APPROVED	2026-11-06 12:06:02.288
cmw4xhovn00x411ejquc328dd	cmw4xhovl00x211ejtxkiyceg	RELT-26239	20	173	221.44	0	2027-10-28 00:00:00	2029-10-28 00:00:00	APPROVED	2026-11-06 12:06:02.291
cmw4xhovr00x711ejih5ncjye	cmw4xhovp00x511ej9uf470im	RGVI-26240	300	21.67	29.25	0	2025-01-28 00:00:00	2027-01-28 00:00:00	APPROVED	2026-11-06 12:06:02.295
cmw4xhovv00xa11ej5p7yyhg2	cmw4xhovt00x811ejhxykim4p	RHIZ-26241	300	22.17	29.93	0	2026-04-28 00:00:00	2028-04-28 00:00:00	APPROVED	2026-11-06 12:06:02.299
cmw4xhovz00xd11ejsjmiut4b	cmw4xhovx00xb11ej2c2onzz0	RISE-26242	100	94.6	122.98	0	2027-07-28 00:00:00	2029-07-28 00:00:00	APPROVED	2026-11-06 12:06:02.303
cmw4xhow200xg11ejw6qc2mzv	cmw4xhow000xe11ej0dl5w6r5	ROCI-26243	300	23.17	31.28	0	2025-10-28 00:00:00	2027-10-28 00:00:00	APPROVED	2026-11-06 12:06:02.307
cmw4xhow600xj11ejs6aynxja	cmw4xhow400xh11ej3b9p03i4	RULL-26244	300	23.67	31.95	0	2026-01-28 00:00:00	2028-01-28 00:00:00	APPROVED	2026-11-06 12:06:02.311
cmw4xhowa00xm11ejsy86ih5r	cmw4xhow800xk11ej2najntsk	SANG-26245	300	24.17	32.63	0	2027-04-28 00:00:00	2029-04-28 00:00:00	APPROVED	2026-11-06 12:06:02.314
cmw4xhowe00xp11ejq3ktb68b	cmw4xhowc00xn11ejoto21ze8	SCAB-26246	20	222	284.16	0	2025-07-28 00:00:00	2027-07-28 00:00:00	APPROVED	2026-11-06 12:06:02.318
cmw4xhowi00xs11ejemyx54lf	cmw4xhowg00xq11ej9hupp217	SEBE-26247	300	25.17	33.98	0	2026-10-28 00:00:00	2028-10-28 00:00:00	APPROVED	2026-11-06 12:06:02.322
cmw4xhowl00xv11ejqkz6tmie	cmw4xhowj00xt11ejrpoqbn0c	SERG-26248	50	212.4	286.74	0	2027-01-28 00:00:00	2029-01-28 00:00:00	APPROVED	2026-11-06 12:06:02.326
cmw4xhowq00xy11ejhs7oty75	cmw4xhown00xw11ejslld9w53	SGIN-26249	50	216.2	291.87	0	2025-04-28 00:00:00	2027-04-28 00:00:00	APPROVED	2026-11-06 12:06:02.33
cmw4xhowu00y111ej0tevprnk	cmw4xhows00xz11ejf5pu1j46	SKIL-26250	20	250	320	0	2026-07-28 00:00:00	2028-07-28 00:00:00	APPROVED	2026-11-06 12:06:02.334
cmw4xhowz00y411ej63ai8u7x	cmw4xhowx00y211eju81g2vk3	SOFT-26251	300	27.17	36.68	0	2027-10-28 00:00:00	2029-10-28 00:00:00	APPROVED	2026-11-06 12:06:02.339
cmw4xhox300y711ejzb2woe8r	cmw4xhox100y511ejzaznkvic	SOFV-26252	300	27.67	37.35	0	2025-01-28 00:00:00	2027-01-28 00:00:00	APPROVED	2026-11-06 12:06:02.344
cmw4xhox900ya11ejkayx3f03	cmw4xhox600y811ej6a40utk2	SOFV-26253	300	28.17	38.03	0	2026-04-28 00:00:00	2028-04-28 00:00:00	APPROVED	2026-11-06 12:06:02.349
cmw4xhoxd00yd11ej7nt8xxs8	cmw4xhoxb00yb11ejsmi3shda	SPAS-26254	50	75.2	101.52	0	2027-07-28 00:00:00	2029-07-28 00:00:00	APPROVED	2026-11-06 12:06:02.354
cmw4xhoxh00yg11ejkolf14mh	cmw4xhoxf00ye11ej6j8b4jfk	SPAS-26255	300	29.17	39.38	0	2025-10-28 00:00:00	2027-10-28 00:00:00	APPROVED	2026-11-06 12:06:02.357
cmw4xhoxl00yj11ejpas0g5zr	cmw4xhoxj00yh11ej57w6khb3	SPAS-26256	300	29.67	40.05	0	2026-01-28 00:00:00	2028-01-28 00:00:00	APPROVED	2026-11-06 12:06:02.361
cmw4xhoxo00ym11ejs25j9fro	cmw4xhoxm00yk11ejpsmwb22i	STEM-26257	300	30.17	40.73	0	2027-04-28 00:00:00	2029-04-28 00:00:00	APPROVED	2026-11-06 12:06:02.365
cmw4xhoxs00yp11ejevmdzlh5	cmw4xhoxq00yn11ejysyxtueu	SULZ-26258	50	90.4	122.04	0	2025-07-28 00:00:00	2027-07-28 00:00:00	APPROVED	2026-11-06 12:06:02.369
cmw4xhoxw00ys11ejh6b1e4f5	cmw4xhoxu00yq11ej9cwt2clr	SUNV-26259	20	133	170.24	0	2026-10-28 00:00:00	2028-10-28 00:00:00	APPROVED	2026-11-06 12:06:02.372
cmw4xhoxz00yv11ejy6l81nbo	cmw4xhoxx00yt11ej6dzytnjz	SUPR-26260	20	140	179.2	0	2027-01-28 00:00:00	2029-01-28 00:00:00	APPROVED	2026-11-06 12:06:02.376
cmw4xhoy300yy11ejc0syc73z	cmw4xhoy100yw11eja8i2iwpc	SYNE-26261	300	10.5	14.18	0	2025-04-28 00:00:00	2027-04-28 00:00:00	APPROVED	2026-11-06 12:06:02.379
cmw4xhoy800z111ejfe5l0czj	cmw4xhoy500yz11ejqbgt7b3a	SYNT-26262	50	105.6	142.56	0	2026-07-28 00:00:00	2028-07-28 00:00:00	APPROVED	2026-11-06 12:06:02.385
cmw4xhoyc00z411ejnbcfyvqt	cmw4xhoyb00z211ejsqy85ju8	THYR-26263	300	11.5	15.53	0	2027-10-28 00:00:00	2029-10-28 00:00:00	APPROVED	2026-11-06 12:06:02.389
cmw4xhoyh00z711ejt1fjvc66	cmw4xhoye00z511ejl8c2kjpx	TORA-26264	50	113.2	152.82	0	2025-01-28 00:00:00	2027-01-28 00:00:00	APPROVED	2026-11-06 12:06:02.393
cmw4xhoym00za11ejvf8seemm	cmw4xhoyk00z811ejo524l4i6	TRAN-26265	300	12.5	16.88	0	2026-04-28 00:00:00	2028-04-28 00:00:00	APPROVED	2026-11-06 12:06:02.398
cmw4xhoyq00zd11ejdjr4rd5h	cmw4xhoyo00zb11ejjksvlpnj	TRAN-26266	50	120.8	163.08	0	2027-07-28 00:00:00	2029-07-28 00:00:00	APPROVED	2026-11-06 12:06:02.402
cmw4xhoyt00zg11ejyap3i9fm	cmw4xhoyr00ze11ejpp75rw2t	TRAX-26267	300	13.5	18.23	0	2025-10-28 00:00:00	2027-10-28 00:00:00	APPROVED	2026-11-06 12:06:02.406
cmw4xhot200va11ejuzgjj700	cmw4xhot000v811ejcgz27aqr	PANA-26217	300	10.17	13.72	0	2026-04-28 00:00:00	2028-04-28 00:00:00	APPROVED	2026-11-06 12:06:02.198
cmw4xhozk010111ejbechtgyl	cmw4xhozi00zz11ejsoschc43	VELO-26274	300	17	22.95	0	2026-07-28 00:00:00	2028-07-28 00:00:00	APPROVED	2026-11-06 12:06:02.432
cmw4xhozo010411ejhp6oblpv	cmw4xhozm010211ejw528fcaq	VEPE-26275	300	17.5	23.63	0	2027-10-28 00:00:00	2029-10-28 00:00:00	APPROVED	2026-11-06 12:06:02.436
cmw4xhozr010711ejza9otul0	cmw4xhozp010511ejifwzi62e	VERM-26276	20	252	322.56	0	2025-01-28 00:00:00	2027-01-28 00:00:00	APPROVED	2026-11-06 12:06:02.44
cmw4xhozv010a11ejg72uw0eh	cmw4xhozt010811ej80fomcmp	VOLT-26277	15	367	477.1	0	2026-04-28 00:00:00	2028-04-28 00:00:00	APPROVED	2026-11-06 12:06:02.443
cmw4xhozy010d11ej1uztrjbc	cmw4xhozx010b11ej1rgkxi7b	VOLT-26278	15	378	491.4	0	2027-07-28 00:00:00	2029-07-28 00:00:00	APPROVED	2026-11-06 12:06:02.447
cmw4xhp02010g11ej2dzlgmje	cmw4xhp00010e11ejhp35x7di	VORE-26279	300	19.5	26.33	0	2025-10-28 00:00:00	2027-10-28 00:00:00	APPROVED	2026-11-06 12:06:02.451
cmw4xhp0y011411ejoza67rxa	cmw4xhp0x011211ejnyi4aik3	ZOFR-26287	50	200.6	270.81	0	2027-10-28 00:00:00	2029-10-28 00:00:00	APPROVED	2026-11-06 12:06:02.483
cmw4xhp13011711ejh2ukviqh	cmw4xhp10011511ejqvtmp27t	ZOLD-26288	300	24	32.4	0	2025-01-28 00:00:00	2027-01-28 00:00:00	APPROVED	2026-11-06 12:06:02.487
cmw4xhp18011a11ejeivxmnry	cmw4xhp15011811ejno58hvf0	ZYTO-26289	300	24.5	33.08	0	2026-04-28 00:00:00	2028-04-28 00:00:00	APPROVED	2026-11-06 12:06:02.492
cmw4xhntp009j11ejdr357877	cmw4xhntj009h11ejougfdsds	SYR-3CC-2601	1000	15	20	0	2026-06-30 00:00:00	2028-06-30 00:00:00	APPROVED	2026-11-06 12:06:00.925
cmw4xhnwg00as11ejdemz8j66	cmw4xhnwe00aq11ejc0hya004	ABD-SP-2616	100	170	220	0	2027-01-31 00:00:00	2029-01-31 00:00:00	APPROVED	2026-11-06 12:06:01.025
cmw4xho2f00dv11ejhejjc7t7	cmw4xho2d00dt11eja2uf2xxz	ALAP-26008	300	14	18.9	0	2027-01-28 00:00:00	2029-01-28 00:00:00	APPROVED	2026-11-06 12:06:01.24
cmw4xho4a00f411ejdahw4y2b	cmw4xho4600f211ejlwupjmh3	AZOM-26023	300	21.5	29.03	0	2027-10-28 00:00:00	2029-10-28 00:00:00	APPROVED	2026-11-06 12:06:01.306
cmw4xho9d00i711ejkwrq2720	cmw4xho9b00i511ejz84gqsil	COEZ-26060	300	18.33	24.75	0	2025-01-28 00:00:00	2027-01-28 00:00:00	APPROVED	2026-11-06 12:06:01.49
cmw4xhobe00jg11ejmula3bly	cmw4xhobb00je11ejjn0v91na	DANZ-26075	300	25.83	34.88	0	2025-10-28 00:00:00	2027-10-28 00:00:00	APPROVED	2026-11-06 12:06:01.562
cmw4xhogi00mj11ejqfo53owe	cmw4xhogf00mh11ejp5lfgdjp	FERO-26112	300	22.67	30.6	0	2026-01-28 00:00:00	2028-01-28 00:00:00	APPROVED	2026-11-06 12:06:01.746
cmw4xhoid00ns11ejviy58u2q	cmw4xhoib00nq11ejkczjn2wg	GETR-26127	300	30.17	40.73	0	2026-10-28 00:00:00	2028-10-28 00:00:00	APPROVED	2026-11-06 12:06:01.813
cmw4xhomn00qv11ej39aiubjg	cmw4xhoml00qt11ej402gg89b	LASI-26164	50	213.2	287.82	0	2027-01-28 00:00:00	2029-01-28 00:00:00	APPROVED	2026-11-06 12:06:01.968
cmw4xhoon00s411ej2thg1hwg	cmw4xhool00s211ejou4k0p10	MAGN-26179	50	110.2	148.77	0	2027-10-28 00:00:00	2029-10-28 00:00:00	APPROVED	2026-11-06 12:06:02.04
cmw4xhosy00v711ej77813vpn	cmw4xhosv00v511ejjfhqs7lh	OXOF-26216	300	31.33	42.3	0	2025-01-28 00:00:00	2027-01-28 00:00:00	APPROVED	2026-11-06 12:06:02.194
cmw4xhour00wg11ej37skgh0n	cmw4xhoup00we11ejsrqz2bz6	PROS-26231	300	17.17	23.18	0	2025-10-28 00:00:00	2027-10-28 00:00:00	APPROVED	2026-11-06 12:06:02.259
cmw4xhoyx00zj11ejfnxb2b0b	cmw4xhoyv00zh11ej3yytwobk	TRIC-26268	300	14	18.9	0	2026-01-28 00:00:00	2028-01-28 00:00:00	APPROVED	2026-11-06 12:06:02.409
cmw4xhoz100zm11ejklrawmrf	cmw4xhoyz00zk11ejgzv2bcvx	TRIS-26269	300	14.5	19.58	0	2027-04-28 00:00:00	2029-04-28 00:00:00	APPROVED	2026-11-06 12:06:02.413
cmw4xhoz500zp11ejmiu856i9	cmw4xhoz300zn11ejqos61ahq	TYNO-26270	15	290	377	0	2025-07-28 00:00:00	2027-07-28 00:00:00	APPROVED	2026-11-06 12:06:02.418
cmw4xhoz900zs11ejmayqvwc9	cmw4xhoz700zq11ejwx3rqhb6	UBKI-26271	300	15.5	20.93	0	2026-10-28 00:00:00	2028-10-28 00:00:00	APPROVED	2026-11-06 12:06:02.421
cmw4xhozd00zv11ejvgxrn1u7	cmw4xhozb00zt11ej210rc0vi	URES-26272	100	93.6	121.68	0	2027-01-28 00:00:00	2029-01-28 00:00:00	APPROVED	2026-11-06 12:06:02.425
cmw4xhozg00zy11ejygwp5j0w	cmw4xhozf00zw11ej7iat0wk9	URSO-26273	300	16.5	22.28	0	2025-04-28 00:00:00	2027-04-28 00:00:00	APPROVED	2026-11-06 12:06:02.429
cmw4xhp06010j11ejb2e25utr	cmw4xhp04010h11ejc25m5pco	XODE-26280	300	20	27	0	2026-01-28 00:00:00	2028-01-28 00:00:00	APPROVED	2026-11-06 12:06:02.455
cmw4xhp0a010m11ejcuz17hqs	cmw4xhp08010k11ejsy4b3s5h	XYLO-26281	50	177.8	240.03	0	2027-04-28 00:00:00	2029-04-28 00:00:00	APPROVED	2026-11-06 12:06:02.459
cmw4xhp0e010p11ejvx3zt9t7	cmw4xhp0c010n11ejey6z3bkg	XYLO-26282	15	202	262.6	0	2025-07-28 00:00:00	2027-07-28 00:00:00	APPROVED	2026-11-06 12:06:02.463
cmw4xhp0i010s11ejumgg22jx	cmw4xhp0g010q11ejnfwc0s4e	YAZ-26283	300	21.5	29.03	0	2026-10-28 00:00:00	2028-10-28 00:00:00	APPROVED	2026-11-06 12:06:02.467
cmw4xhp0m010v11ejpamjua0b	cmw4xhp0k010t11ej6nwyx3zb	ZEEG-26284	300	22	29.7	0	2027-01-28 00:00:00	2029-01-28 00:00:00	APPROVED	2026-11-06 12:06:02.471
cmw4xhp0q010y11ej0ld6alxf	cmw4xhp0o010w11ejiutcv5j8	ZETR-26285	20	135	172.8	0	2025-04-28 00:00:00	2027-04-28 00:00:00	APPROVED	2026-11-06 12:06:02.474
cmw4xhp0u011111ejsm1owwa7	cmw4xhp0s010z11ejqoct5mzs	ZINA-26286	50	196.8	265.68	0	2026-07-28 00:00:00	2028-07-28 00:00:00	APPROVED	2026-11-06 12:06:02.479
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, name, email, password, role, "biometricHash", "createdAt", "updatedAt", "displayPassword") FROM stdin;
cmw4xf0ea0008896zsciiahzd	Hospital Administrator	admin@hms.com	$2a$10$Uu7jywNgxUBmhUutE7Ka8ea5ODuwQ1/MvXvUIiYWWeu/u4SqvAW9G	ADMIN	\N	2026-11-06 12:03:57.25	2026-11-06 12:22:44.441	AdminPass123!
cmw4xf0ed000a896zw4w45uej	Front Desk Receptionist	reception@hms.com	$2a$10$f8a3.jJgrw9YYeoztdu7z.3WbfOKxodqTjI1mL1gRhyx.aWttpH6S	RECEPTIONIST	\N	2026-11-06 12:03:57.254	2026-11-06 12:22:44.446	ReceptionPass123!
cmw4xf0ef000c896zrnghs0qk	Dispensary Pharmacist	pharma@hms.com	$2a$10$wf8.i/cZk4ni9Oo8vJzAse/mjML3K7U9dayaqRX8rbgrHOeeFoI4W	PHARMACIST	\N	2026-11-06 12:03:57.255	2026-11-06 12:22:44.45	PharmaPass123!
cmw4xf0eh000e896zyir7wkjp	Dr. Tariq Khan (Physician)	doctor@hms.com	$2a$10$dlsa7A1keUJQKK3olwRpAuUeH1arbb4sEZXite.CWNJgXbaBte/fK	DOCTOR	\N	2026-11-06 12:03:57.257	2026-11-06 12:22:44.453	DoctorPass123!
cmw4xf0g4000h896zcx4zz318	Abu Bakar (Admin)	admin@hms.local	$2a$10$nwiKfKwJNBMA0LiKhcEjmO9W5FEGZ.3V9QBsFc/DbQkmeVQlvUmAi	ADMIN	\N	2026-11-06 12:03:57.316	2026-11-06 12:22:44.516	admin123
cmw4xf0hw000k896zc9mbjb50	Adnan Ahmed	receptionist@hms.local	$2a$10$ABy4YKF8gyXtXH32EPpaT.gXKSNEfKJR1oKszOC0DYueXLMS4uhoy	RECEPTIONIST	\N	2026-11-06 12:03:57.38	2026-11-06 12:22:44.579	reception123
cmw4xf0jl000m896zx0x3s87c	Muhammad Tariq	pharmacist@hms.local	$2a$10$tIWXVlDhTm7lrIVnI3Xn1eup3d49GLddK/szyu8v5uw/X27SSJcmi	PHARMACIST	\N	2026-11-06 12:03:57.441	2026-11-06 12:22:44.644	pharma123
\.


--
-- Data for Name: UserBiometricEnrollment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserBiometricEnrollment" (id, "userId", "fingerPosition", "encryptedTemplate", "templateAlgorithm", "qualityScore", "scannerModel", "adapterType", "enrolledById", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Vendor; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Vendor" (id, name, "contactPerson", phone, email, address, balance, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: VendorPayment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."VendorPayment" (id, "paymentNumber", "vendorId", "purchaseOrderId", amount, "paymentMethod", "referenceNumber", notes, "paidById", "paymentDate", "createdAt") FROM stdin;
\.


--
-- Data for Name: Visit; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Visit" (id, "patientId", "tokenId", "serviceType", fee, notes, diagnosis, "createdAt") FROM stdin;
\.


--
-- Name: ApprovalRequest ApprovalRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ApprovalRequest"
    ADD CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY (id);


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: BiometricChallenge BiometricChallenge_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BiometricChallenge"
    ADD CONSTRAINT "BiometricChallenge_pkey" PRIMARY KEY (id);


--
-- Name: BiometricCredential BiometricCredential_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BiometricCredential"
    ADD CONSTRAINT "BiometricCredential_pkey" PRIMARY KEY (id);


--
-- Name: DailyTokenCounter DailyTokenCounter_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DailyTokenCounter"
    ADD CONSTRAINT "DailyTokenCounter_pkey" PRIMARY KEY (id);


--
-- Name: DailyTokenLog DailyTokenLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DailyTokenLog"
    ADD CONSTRAINT "DailyTokenLog_pkey" PRIMARY KEY (id);


--
-- Name: DrawerAdjustment DrawerAdjustment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DrawerAdjustment"
    ADD CONSTRAINT "DrawerAdjustment_pkey" PRIMARY KEY (id);


--
-- Name: Expenditure Expenditure_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Expenditure"
    ADD CONSTRAINT "Expenditure_pkey" PRIMARY KEY (id);


--
-- Name: InventoryPurchase InventoryPurchase_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InventoryPurchase"
    ADD CONSTRAINT "InventoryPurchase_pkey" PRIMARY KEY (id);


--
-- Name: InvoiceItem InvoiceItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InvoiceItem"
    ADD CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY (id);


--
-- Name: Invoice Invoice_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_pkey" PRIMARY KEY (id);


--
-- Name: MedicineInventory MedicineInventory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MedicineInventory"
    ADD CONSTRAINT "MedicineInventory_pkey" PRIMARY KEY (id);


--
-- Name: Medicine Medicine_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Medicine"
    ADD CONSTRAINT "Medicine_pkey" PRIMARY KEY (id);


--
-- Name: PatientBiometricEnrollment PatientBiometricEnrollment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PatientBiometricEnrollment"
    ADD CONSTRAINT "PatientBiometricEnrollment_pkey" PRIMARY KEY (id);


--
-- Name: Patient Patient_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Patient"
    ADD CONSTRAINT "Patient_pkey" PRIMARY KEY (id);


--
-- Name: PharmacySaleItem PharmacySaleItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PharmacySaleItem"
    ADD CONSTRAINT "PharmacySaleItem_pkey" PRIMARY KEY (id);


--
-- Name: PharmacySale PharmacySale_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PharmacySale"
    ADD CONSTRAINT "PharmacySale_pkey" PRIMARY KEY (id);


--
-- Name: PurchaseOrderItem PurchaseOrderItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PurchaseOrderItem"
    ADD CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY (id);


--
-- Name: PurchaseOrder PurchaseOrder_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PurchaseOrder"
    ADD CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY (id);


--
-- Name: ShiftClosing ShiftClosing_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ShiftClosing"
    ADD CONSTRAINT "ShiftClosing_pkey" PRIMARY KEY (id);


--
-- Name: StockBatch StockBatch_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."StockBatch"
    ADD CONSTRAINT "StockBatch_pkey" PRIMARY KEY (id);


--
-- Name: UserBiometricEnrollment UserBiometricEnrollment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserBiometricEnrollment"
    ADD CONSTRAINT "UserBiometricEnrollment_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: VendorPayment VendorPayment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."VendorPayment"
    ADD CONSTRAINT "VendorPayment_pkey" PRIMARY KEY (id);


--
-- Name: Vendor Vendor_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Vendor"
    ADD CONSTRAINT "Vendor_pkey" PRIMARY KEY (id);


--
-- Name: Visit Visit_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Visit"
    ADD CONSTRAINT "Visit_pkey" PRIMARY KEY (id);


--
-- Name: BiometricChallenge_challenge_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "BiometricChallenge_challenge_key" ON public."BiometricChallenge" USING btree (challenge);


--
-- Name: BiometricCredential_credentialId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "BiometricCredential_credentialId_key" ON public."BiometricCredential" USING btree ("credentialId");


--
-- Name: DailyTokenCounter_dateStr_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DailyTokenCounter_dateStr_idx" ON public."DailyTokenCounter" USING btree ("dateStr");


--
-- Name: DailyTokenCounter_dateStr_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "DailyTokenCounter_dateStr_key" ON public."DailyTokenCounter" USING btree ("dateStr");


--
-- Name: DailyTokenLog_dateStr_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DailyTokenLog_dateStr_idx" ON public."DailyTokenLog" USING btree ("dateStr");


--
-- Name: DailyTokenLog_patientId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DailyTokenLog_patientId_idx" ON public."DailyTokenLog" USING btree ("patientId");


--
-- Name: DailyTokenLog_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DailyTokenLog_status_idx" ON public."DailyTokenLog" USING btree (status);


--
-- Name: DailyTokenLog_tokenNumber_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DailyTokenLog_tokenNumber_idx" ON public."DailyTokenLog" USING btree ("tokenNumber");


--
-- Name: InventoryPurchase_batchNo_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "InventoryPurchase_batchNo_idx" ON public."InventoryPurchase" USING btree ("batchNo");


--
-- Name: InventoryPurchase_itemName_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "InventoryPurchase_itemName_idx" ON public."InventoryPurchase" USING btree ("itemName");


--
-- Name: Invoice_invoiceNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON public."Invoice" USING btree ("invoiceNumber");


--
-- Name: Invoice_visitId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Invoice_visitId_key" ON public."Invoice" USING btree ("visitId");


--
-- Name: MedicineInventory_batchNo_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MedicineInventory_batchNo_idx" ON public."MedicineInventory" USING btree ("batchNo");


--
-- Name: MedicineInventory_itemName_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MedicineInventory_itemName_idx" ON public."MedicineInventory" USING btree ("itemName");


--
-- Name: MedicineInventory_sNo_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MedicineInventory_sNo_idx" ON public."MedicineInventory" USING btree ("sNo");


--
-- Name: Medicine_category_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Medicine_category_idx" ON public."Medicine" USING btree (category);


--
-- Name: Medicine_itemType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Medicine_itemType_idx" ON public."Medicine" USING btree ("itemType");


--
-- Name: Medicine_name_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Medicine_name_idx" ON public."Medicine" USING btree (name);


--
-- Name: PatientBiometricEnrollment_patientId_fingerPosition_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "PatientBiometricEnrollment_patientId_fingerPosition_key" ON public."PatientBiometricEnrollment" USING btree ("patientId", "fingerPosition");


--
-- Name: Patient_patientUid_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Patient_patientUid_key" ON public."Patient" USING btree ("patientUid");


--
-- Name: PharmacySale_saleNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "PharmacySale_saleNumber_key" ON public."PharmacySale" USING btree ("saleNumber");


--
-- Name: PurchaseOrder_poNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "PurchaseOrder_poNumber_key" ON public."PurchaseOrder" USING btree ("poNumber");


--
-- Name: UserBiometricEnrollment_userId_fingerPosition_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "UserBiometricEnrollment_userId_fingerPosition_key" ON public."UserBiometricEnrollment" USING btree ("userId", "fingerPosition");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: VendorPayment_paymentNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "VendorPayment_paymentNumber_key" ON public."VendorPayment" USING btree ("paymentNumber");


--
-- Name: Vendor_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Vendor_name_key" ON public."Vendor" USING btree (name);


--
-- Name: ApprovalRequest ApprovalRequest_requestedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ApprovalRequest"
    ADD CONSTRAINT "ApprovalRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AuditLog AuditLog_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: BiometricCredential BiometricCredential_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BiometricCredential"
    ADD CONSTRAINT "BiometricCredential_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."Patient"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DailyTokenLog DailyTokenLog_issuedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DailyTokenLog"
    ADD CONSTRAINT "DailyTokenLog_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DailyTokenLog DailyTokenLog_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DailyTokenLog"
    ADD CONSTRAINT "DailyTokenLog_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."Patient"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DrawerAdjustment DrawerAdjustment_approvedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DrawerAdjustment"
    ADD CONSTRAINT "DrawerAdjustment_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DrawerAdjustment DrawerAdjustment_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DrawerAdjustment"
    ADD CONSTRAINT "DrawerAdjustment_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Expenditure Expenditure_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Expenditure"
    ADD CONSTRAINT "Expenditure_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: InvoiceItem InvoiceItem_invoiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InvoiceItem"
    ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES public."Invoice"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Invoice Invoice_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."Patient"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Invoice Invoice_tokenId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES public."DailyTokenLog"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Invoice Invoice_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Invoice Invoice_visitId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES public."Visit"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PatientBiometricEnrollment PatientBiometricEnrollment_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PatientBiometricEnrollment"
    ADD CONSTRAINT "PatientBiometricEnrollment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."Patient"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PharmacySaleItem PharmacySaleItem_medicineId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PharmacySaleItem"
    ADD CONSTRAINT "PharmacySaleItem_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES public."Medicine"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PharmacySaleItem PharmacySaleItem_saleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PharmacySaleItem"
    ADD CONSTRAINT "PharmacySaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES public."PharmacySale"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PharmacySale PharmacySale_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PharmacySale"
    ADD CONSTRAINT "PharmacySale_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."Patient"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PharmacySale PharmacySale_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PharmacySale"
    ADD CONSTRAINT "PharmacySale_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PurchaseOrderItem PurchaseOrderItem_purchaseOrderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PurchaseOrderItem"
    ADD CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES public."PurchaseOrder"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PurchaseOrder PurchaseOrder_vendorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PurchaseOrder"
    ADD CONSTRAINT "PurchaseOrder_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES public."Vendor"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ShiftClosing ShiftClosing_approvedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ShiftClosing"
    ADD CONSTRAINT "ShiftClosing_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ShiftClosing ShiftClosing_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ShiftClosing"
    ADD CONSTRAINT "ShiftClosing_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StockBatch StockBatch_medicineId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."StockBatch"
    ADD CONSTRAINT "StockBatch_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES public."Medicine"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: UserBiometricEnrollment UserBiometricEnrollment_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserBiometricEnrollment"
    ADD CONSTRAINT "UserBiometricEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: VendorPayment VendorPayment_paidById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."VendorPayment"
    ADD CONSTRAINT "VendorPayment_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: VendorPayment VendorPayment_purchaseOrderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."VendorPayment"
    ADD CONSTRAINT "VendorPayment_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES public."PurchaseOrder"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: VendorPayment VendorPayment_vendorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."VendorPayment"
    ADD CONSTRAINT "VendorPayment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES public."Vendor"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Visit Visit_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Visit"
    ADD CONSTRAINT "Visit_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."Patient"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Visit Visit_tokenId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Visit"
    ADD CONSTRAINT "Visit_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES public."DailyTokenLog"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Tables and Initial Seeds for Ultrasound & Token Services
--

CREATE TABLE IF NOT EXISTS public."UltrasoundService" (
    id text NOT NULL PRIMARY KEY,
    name text NOT NULL UNIQUE,
    price double precision NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS "UltrasoundService_name_idx" ON public."UltrasoundService" (name);
CREATE INDEX IF NOT EXISTS "UltrasoundService_isActive_idx" ON public."UltrasoundService" ("isActive");

CREATE TABLE IF NOT EXISTS public."TokenService" (
    id text NOT NULL PRIMARY KEY,
    name text NOT NULL UNIQUE,
    fee double precision NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS "TokenService_name_idx" ON public."TokenService" (name);
CREATE INDEX IF NOT EXISTS "TokenService_isActive_idx" ON public."TokenService" ("isActive");

INSERT INTO public."UltrasoundService" (id, name, price, "isActive", "createdAt", "updatedAt")
VALUES 
  ('us-abdomen', 'Ultrasound Abdomen', 700.0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('us-tvs', 'Ultrasound TVS', 1200.0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('us-lks', 'Ultrasound Liver, Kidney & Stomach', 1200.0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public."TokenService" (id, name, fee, "isActive", "createdAt", "updatedAt")
VALUES
  ('ts-opd', 'OPD Fees', 300.0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ts-sugar', 'Sugar Test', 100.0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ts-upd', 'U P D', 100.0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ts-bp', 'BP', 50.0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (name) DO NOTHING;


--
-- Tables for Doctor Management, Attendance, Leaves & Payroll
--

CREATE TABLE IF NOT EXISTS public."Doctor" (
    id text NOT NULL PRIMARY KEY,
    "userId" text UNIQUE,
    name text NOT NULL,
    specialization text NOT NULL,
    phone text,
    email text,
    "baseSalary" double precision DEFAULT 0 NOT NULL,
    "payType" text DEFAULT 'MONTHLY' NOT NULL,
    "perPatientShare" double precision DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "Doctor_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "Doctor_name_idx" ON public."Doctor" (name);
CREATE INDEX IF NOT EXISTS "Doctor_specialization_idx" ON public."Doctor" (specialization);
CREATE INDEX IF NOT EXISTS "Doctor_isActive_idx" ON public."Doctor" ("isActive");

ALTER TABLE public."DailyTokenLog" ADD COLUMN IF NOT EXISTS "doctorId" text;
CREATE INDEX IF NOT EXISTS "DailyTokenLog_doctorId_idx" ON public."DailyTokenLog" ("doctorId");

ALTER TABLE public."Visit" ADD COLUMN IF NOT EXISTS "doctorId" text;
CREATE INDEX IF NOT EXISTS "Visit_doctorId_idx" ON public."Visit" ("doctorId");

CREATE TABLE IF NOT EXISTS public."DoctorAttendance" (
    id text NOT NULL PRIMARY KEY,
    "doctorId" text NOT NULL,
    "dateStr" text NOT NULL,
    status text DEFAULT 'PRESENT' NOT NULL,
    "checkInTime" text,
    "checkOutTime" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "DoctorAttendance_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public."Doctor"(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT "DoctorAttendance_doctorId_dateStr_key" UNIQUE ("doctorId", "dateStr")
);

CREATE INDEX IF NOT EXISTS "DoctorAttendance_doctorId_idx" ON public."DoctorAttendance" ("doctorId");
CREATE INDEX IF NOT EXISTS "DoctorAttendance_dateStr_idx" ON public."DoctorAttendance" ("dateStr");
CREATE INDEX IF NOT EXISTS "DoctorAttendance_status_idx" ON public."DoctorAttendance" (status);

CREATE TABLE IF NOT EXISTS public."DoctorLeave" (
    id text NOT NULL PRIMARY KEY,
    "doctorId" text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    reason text NOT NULL,
    status text DEFAULT 'APPROVED' NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "DoctorLeave_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public."Doctor"(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "DoctorLeave_doctorId_idx" ON public."DoctorLeave" ("doctorId");
CREATE INDEX IF NOT EXISTS "DoctorLeave_status_idx" ON public."DoctorLeave" (status);

CREATE TABLE IF NOT EXISTS public."DoctorPayroll" (
    id text NOT NULL PRIMARY KEY,
    "doctorId" text NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    "basePay" double precision DEFAULT 0 NOT NULL,
    "workingDays" integer DEFAULT 0 NOT NULL,
    "totalVisits" integer DEFAULT 0 NOT NULL,
    bonuses double precision DEFAULT 0 NOT NULL,
    deductions double precision DEFAULT 0 NOT NULL,
    "netPay" double precision DEFAULT 0 NOT NULL,
    status text DEFAULT 'DRAFT' NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "DoctorPayroll_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public."Doctor"(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT "DoctorPayroll_doctorId_year_month_key" UNIQUE ("doctorId", year, month)
);

CREATE INDEX IF NOT EXISTS "DoctorPayroll_doctorId_idx" ON public."DoctorPayroll" ("doctorId");
CREATE INDEX IF NOT EXISTS "DoctorPayroll_year_month_idx" ON public."DoctorPayroll" (year, month);

INSERT INTO public."Doctor" (id, name, specialization, phone, email, "baseSalary", "payType", "perPatientShare", "isActive", "createdAt", "updatedAt")
VALUES 
  ('doc-tariq', 'Dr. Tariq Mahmood', 'Consultant Sonologist & Radiologist', '0300-4567891', 'tariq.sonology@ruqayya.com', 180000.0, 'MONTHLY', 200.0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('doc-ayesha', 'Dr. Ayesha Khan', 'General Physician & OPD Consultant', '0321-7654321', 'ayesha.opd@ruqayya.com', 150000.0, 'MONTHLY', 150.0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('doc-fatima', 'Dr. Fatima Noor', 'Gynecologist & Obstetrician', '0333-9876543', 'fatima.gynae@ruqayya.com', 190000.0, 'MONTHLY', 250.0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('doc-imran', 'Dr. Imran Sarwar', 'Pediatrician & Child Specialist', '0345-1234567', 'imran.peds@ruqayya.com', 160000.0, 'MONTHLY', 150.0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;


--
-- PostgreSQL database dump complete
--

\unrestrict NADgBaYuMizOibv3QI1W8tXaCRxVNbjEgJtuPQyVDC5WVZUkeDEwrUub32ZdI19

