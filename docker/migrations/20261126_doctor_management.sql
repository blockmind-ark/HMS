BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '20s';

ALTER TABLE public."Doctor"
  ADD COLUMN IF NOT EXISTS "penaltyPolicy" jsonb;

ALTER TABLE public."DoctorAttendance"
  ADD COLUMN IF NOT EXISTS "isLocked" boolean NOT NULL DEFAULT true;

ALTER TABLE public."DoctorPayroll"
  ADD COLUMN IF NOT EXISTS "penaltyBreakdown" jsonb;

COMMIT;
