CREATE TABLE "reservation_modification_requests" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "reservation_modification_requests_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "reservation_modification_requests_tenantId_status_idx" ON "reservation_modification_requests"("tenantId", "status");
CREATE INDEX "reservation_modification_requests_reservationId_idx" ON "reservation_modification_requests"("reservationId");
ALTER TABLE "reservation_modification_requests" ADD CONSTRAINT "reservation_modification_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reservation_modification_requests" ADD CONSTRAINT "reservation_modification_requests_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
