-- DropIndex
DROP INDEX IF EXISTS "audit_logs_createdAt_idx";

-- DropIndex
DROP INDEX IF EXISTS "audit_logs_tenantId_idx";

-- DropIndex
DROP INDEX IF EXISTS "folios_tenantId_idx";

-- DropIndex
DROP INDEX IF EXISTS "housekeeping_tasks_tenantId_idx";

-- DropIndex
DROP INDEX IF EXISTS "usage_records_tenantId_metric_idx";

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_createdAt_idx" ON "audit_logs"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "folios_tenantId_status_createdAt_idx" ON "folios"("tenantId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "housekeeping_tasks_tenantId_status_scheduledAt_idx" ON "housekeeping_tasks"("tenantId", "status", "scheduledAt");

-- CreateIndex
CREATE INDEX "reservation_stays_date_idx" ON "reservation_stays"("date");

-- CreateIndex
CREATE INDEX "reservation_stays_reservationId_idx" ON "reservation_stays"("reservationId");

-- CreateIndex
CREATE INDEX "reservations_tenantId_status_arrivalDate_idx" ON "reservations"("tenantId", "status", "arrivalDate");

-- CreateIndex
CREATE INDEX "reservations_tenantId_propertyId_status_idx" ON "reservations"("tenantId", "propertyId", "status");

-- CreateIndex
CREATE INDEX "usage_records_tenantId_metric_recordedAt_idx" ON "usage_records"("tenantId", "metric", "recordedAt");
