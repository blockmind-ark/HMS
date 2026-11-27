-- STAGING REVIEW ONLY. Do not apply automatically.
-- Run each statement outside a transaction after backup and approval.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Invoice_status_createdAt_idx" ON "Invoice" ("status", "createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Visit_createdAt_idx" ON "Visit" ("createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Visit_doctorId_createdAt_idx" ON "Visit" ("doctorId", "createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "StockBatch_medicineId_approvalStatus_expiryDate_idx" ON "StockBatch" ("medicineId", "approvalStatus", "expiryDate");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "PharmacySaleItem_saleId_idx" ON "PharmacySaleItem" ("saleId");
