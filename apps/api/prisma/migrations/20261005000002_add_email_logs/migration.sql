-- CreateTable
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "payload" JSONB,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "error" TEXT,
    "relatedType" TEXT,
    "relatedId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_logs_tenantId_createdAt_idx" ON "email_logs"("tenantId", "createdAt");
CREATE INDEX "email_logs_status_idx" ON "email_logs"("status");
CREATE INDEX "email_logs_related_idx" ON "email_logs"("relatedType", "relatedId");

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Pre-arrival tracking on reservations
ALTER TABLE "reservations" ADD COLUMN "preArrivalSentAt" TIMESTAMP(3);