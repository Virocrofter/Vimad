-- CreateTable
CREATE TABLE "payment_requests" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "reservationId" TEXT,
    "guestId" TEXT,
    "folioId" TEXT,
    "paymentId" TEXT,
    "reference" TEXT NOT NULL,
    "paystackRequestCode" TEXT,
    "paystackOfflineRef" TEXT,
    "hostedUrl" TEXT,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ZAR',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "description" TEXT,
    "depositPercent" INTEGER NOT NULL DEFAULT 50,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "remindersSent" INTEGER NOT NULL DEFAULT 0,
    "nextReminderAt" TIMESTAMP(3),
    "reminderOffsetsHours" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "autoCancelEnabled" BOOLEAN NOT NULL DEFAULT false,
    "autoCancelAt" TIMESTAMP(3),
    "reservationCancelled" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_requests_reference_key" ON "payment_requests"("reference");
CREATE UNIQUE INDEX "payment_requests_paymentId_key" ON "payment_requests"("paymentId");
CREATE INDEX "payment_requests_tenantId_status_idx" ON "payment_requests"("tenantId", "status");
CREATE INDEX "payment_requests_tenantId_dueDate_idx" ON "payment_requests"("tenantId", "dueDate");
CREATE INDEX "payment_requests_nextReminderAt_idx" ON "payment_requests"("nextReminderAt");
CREATE INDEX "payment_requests_reservationId_idx" ON "payment_requests"("reservationId");

-- AddForeignKey
ALTER TABLE "payment_requests" ADD CONSTRAINT "payment_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_requests" ADD CONSTRAINT "payment_requests_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payment_requests" ADD CONSTRAINT "payment_requests_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;