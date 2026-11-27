-- Only after verifying these indexes were created by this migration.
-- Run outside a transaction, with approval.
DROP INDEX CONCURRENTLY IF EXISTS "PharmacySaleItem_saleId_idx";
DROP INDEX CONCURRENTLY IF EXISTS "StockBatch_medicineId_approvalStatus_expiryDate_idx";
DROP INDEX CONCURRENTLY IF EXISTS "Visit_doctorId_createdAt_idx";
DROP INDEX CONCURRENTLY IF EXISTS "Visit_createdAt_idx";
DROP INDEX CONCURRENTLY IF EXISTS "Invoice_status_createdAt_idx";
