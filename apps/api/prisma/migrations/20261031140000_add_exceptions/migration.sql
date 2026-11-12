-- Phase 4 exception queue (audit §6). Applied via psql ON PURPOSE: the audit
-- gates `prisma migrate` until the marketing schema drift is reconciled, so
-- this table lands outside migrate history for now. Formal migration ships
-- with that reconciliation.
CREATE TABLE IF NOT EXISTS "exceptions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "title" TEXT NOT NULL,
    "detail" TEXT,
    "recommendedAction" TEXT,
    "actionUrl" TEXT,
    "reservationId" TEXT,
    "guestId" TEXT,
    "roomId" TEXT,
    "paymentId" TEXT,
    "taskId" TEXT,
    "connectionId" TEXT,
    "dedupeKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "ownerId" TEXT,
    "assigneeId" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "resolutionNote" TEXT,
    "dismissedAt" TIMESTAMP(3),
    "dismissedBy" TEXT,
    "dismissReason" TEXT,
    "slaDueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "exceptions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "exceptions_tenantId_dedupeKey_key" ON "exceptions"("tenantId", "dedupeKey");
CREATE INDEX IF NOT EXISTS "exceptions_tenantId_status_idx" ON "exceptions"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "exceptions_tenantId_slaDueAt_idx" ON "exceptions"("tenantId", "slaDueAt");
