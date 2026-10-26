-- AlterTable
ALTER TABLE "TenantReportRun" RENAME CONSTRAINT "ReportRun_pkey" TO "TenantReportRun_pkey";

-- AlterTable
ALTER TABLE "TenantScheduledReport" RENAME CONSTRAINT "ScheduledReport_pkey" TO "TenantScheduledReport_pkey";

-- RenameIndex
ALTER INDEX "ReportRun_tenantId_createdAt_idx" RENAME TO "TenantReportRun_tenantId_createdAt_idx";

-- RenameIndex
ALTER INDEX "ReportRun_tenantId_definitionKey_idx" RENAME TO "TenantReportRun_tenantId_definitionKey_idx";

-- RenameIndex
ALTER INDEX "ScheduledReport_tenantId_isActive_nextRunAt_idx" RENAME TO "TenantScheduledReport_tenantId_isActive_nextRunAt_idx";

