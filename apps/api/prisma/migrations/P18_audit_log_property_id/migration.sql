ALTER TABLE "audit_logs" ADD COLUMN "propertyId" TEXT;

CREATE INDEX "audit_logs_tenantId_propertyId_createdAt_idx" ON "audit_logs"("tenantId", "propertyId", "createdAt");
