CREATE TABLE IF NOT EXISTS "usage_ledger" (
  "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "metric" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL, "unit" TEXT NOT NULL, "period" TEXT NOT NULL,
  "unitCost" DECIMAL(12,6), "ratedAmount" DECIMAL(12,2),
  "status" TEXT NOT NULL DEFAULT 'pending', "invoiceId" TEXT,
  "idempotencyKey" TEXT, "metadata" JSONB,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "usage_ledger_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX IF NOT EXISTS "usage_ledger_idem_key" ON "usage_ledger"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "usage_ledger_tenant_period_idx" ON "usage_ledger"("tenantId", "period", "status");
