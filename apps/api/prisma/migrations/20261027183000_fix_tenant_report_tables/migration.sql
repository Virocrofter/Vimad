CREATE TABLE IF NOT EXISTS "TenantReportRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "definitionKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "params" JSONB NOT NULL DEFAULT '{}',
    "result" JSONB,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "error" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TenantReportRun_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "TenantReportRun_tenantId_createdAt_idx" ON "TenantReportRun"("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "TenantReportRun_tenantId_definitionKey_idx" ON "TenantReportRun"("tenantId", "definitionKey");
CREATE TABLE IF NOT EXISTS "TenantScheduledReport" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "definitionKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "params" JSONB NOT NULL DEFAULT '{}',
    "frequency" TEXT NOT NULL,
    "dayOfWeek" INTEGER,
    "dayOfMonth" INTEGER,
    "timeOfDay" TEXT NOT NULL,
    "recipients" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TenantScheduledReport_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "TenantScheduledReport_tenantId_isActive_nextRunAt_idx" ON "TenantScheduledReport"("tenantId", "isActive", "nextRunAt");
