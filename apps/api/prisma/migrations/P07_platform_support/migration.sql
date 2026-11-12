CREATE TABLE IF NOT EXISTS "support_access_requests" (
  "id" TEXT NOT NULL, "caseId" TEXT NOT NULL, "tenantId" TEXT NOT NULL,
  "requestedBy" TEXT NOT NULL, "scope" TEXT NOT NULL DEFAULT 'read_only',
  "purpose" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'pending',
  "expiresAt" TIMESTAMP(3), "approvedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "support_access_requests_pkey" PRIMARY KEY ("id"));
CREATE INDEX IF NOT EXISTS "sar_caseId_idx" ON "support_access_requests"("caseId");
