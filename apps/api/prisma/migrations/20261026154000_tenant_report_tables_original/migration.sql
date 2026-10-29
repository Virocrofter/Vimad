DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'TenantReportRun') THEN
    CREATE TABLE "TenantReportRun" (
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
      CONSTRAINT "ReportRun_pkey" PRIMARY KEY ("id")
    );
    CREATE INDEX "ReportRun_tenantId_createdAt_idx" ON "TenantReportRun"("tenantId", "createdAt");
    CREATE INDEX "ReportRun_tenantId_definitionKey_idx" ON "TenantReportRun"("tenantId", "definitionKey");
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'TenantScheduledReport') THEN
    CREATE TABLE "TenantScheduledReport" (
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
      CONSTRAINT "ScheduledReport_pkey" PRIMARY KEY ("id")
    );
    CREATE INDEX "ScheduledReport_tenantId_isActive_nextRunAt_idx" ON "TenantScheduledReport"("tenantId", "isActive", "nextRunAt");
  END IF;
END $$;
