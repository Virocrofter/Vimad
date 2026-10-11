-- CreateTable
CREATE TABLE "night_audit_schedules" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "scheduledTime" TEXT NOT NULL DEFAULT '02:00',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "autoRun" BOOLEAN NOT NULL DEFAULT false,
    "steps" JSONB NOT NULL DEFAULT '{}',
    "notifyEmails" TEXT[],
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "night_audit_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "night_audit_schedules_tenantId_idx" ON "night_audit_schedules"("tenantId");

-- CreateIndex
CREATE INDEX "night_audit_schedules_propertyId_idx" ON "night_audit_schedules"("propertyId");

-- CreateIndex
CREATE INDEX "night_audit_schedules_nextRunAt_idx" ON "night_audit_schedules"("nextRunAt");

-- CreateIndex
CREATE INDEX "night_audit_schedules_isActive_idx" ON "night_audit_schedules"("isActive");

-- AddForeignKey
ALTER TABLE "night_audit_schedules" ADD CONSTRAINT "night_audit_schedules_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "night_audit_schedules" ADD CONSTRAINT "night_audit_schedules_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
