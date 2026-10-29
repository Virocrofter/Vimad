-- Paystack transaction IDs exceeded INT4 (2^31); every real charge.success
-- webhook crashed on this write. Widen to BIGINT (data-preserving).
ALTER TABLE "payments" ALTER COLUMN "paystackId" TYPE BIGINT;
