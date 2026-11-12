ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "billingPeriod" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "invoices_tenantId_billingPeriod_key"
  ON "invoices"("tenantId", "billingPeriod") WHERE "billingPeriod" IS NOT NULL;
