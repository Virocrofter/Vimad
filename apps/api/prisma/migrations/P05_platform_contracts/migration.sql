CREATE TABLE IF NOT EXISTS "contracts" (
  "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "legalEntity" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "modules" JSONB NOT NULL DEFAULT '[]', "roomBand" TEXT, "currency" TEXT NOT NULL DEFAULT 'ZAR',
  "listFee" DECIMAL(12,2) NOT NULL, "netFee" DECIMAL(12,2) NOT NULL, "discountPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "discountApprovedBy" TEXT, "startDate" DATE NOT NULL, "endDate" DATE NOT NULL,
  "renewalNoticeDays" INTEGER NOT NULL DEFAULT 30, "autoRenew" BOOLEAN NOT NULL DEFAULT false,
  "paymentMethod" TEXT NOT NULL DEFAULT 'invoice', "signatories" JSONB NOT NULL DEFAULT '[]',
  "documentUrl" TEXT, "version" INTEGER NOT NULL DEFAULT 1,
  "createdBy" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "contracts_pkey" PRIMARY KEY ("id"));
CREATE INDEX IF NOT EXISTS "contracts_tenantId_idx" ON "contracts"("tenantId");
CREATE INDEX IF NOT EXISTS "contracts_status_endDate_idx" ON "contracts"("status", "endDate");
CREATE TABLE IF NOT EXISTS "contract_events" (
  "id" TEXT NOT NULL, "contractId" TEXT NOT NULL, "type" TEXT NOT NULL, "payload" JSONB,
  "actor" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "contract_events_pkey" PRIMARY KEY ("id"));
CREATE INDEX IF NOT EXISTS "contract_events_contractId_idx" ON "contract_events"("contractId", "createdAt");
