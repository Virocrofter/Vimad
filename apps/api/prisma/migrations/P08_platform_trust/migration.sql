CREATE TABLE IF NOT EXISTS "data_requests" (
  "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "type" TEXT NOT NULL,
  "purpose" TEXT NOT NULL, "requestedBy" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending', "result" JSONB,
  "expiresAt" TIMESTAMP(3), "completedAt" TIMESTAMP(3),
  "createdBy" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "data_requests_pkey" PRIMARY KEY ("id"));
CREATE INDEX IF NOT EXISTS "data_requests_tenant_status_idx" ON "data_requests"("tenantId", "status");
CREATE TABLE IF NOT EXISTS "retention_policies" (
  "id" TEXT NOT NULL, "dataClass" TEXT NOT NULL, "tenantId" TEXT,
  "schedule" JSONB NOT NULL, "legalHold" BOOLEAN NOT NULL DEFAULT false,
  "holdReason" TEXT, "updatedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "retention_policies_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX IF NOT EXISTS "retention_class_tenant_key" ON "retention_policies"("dataClass", "tenantId");
