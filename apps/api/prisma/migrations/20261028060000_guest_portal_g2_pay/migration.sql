-- G2: Guest-portal folio split requests (guest offers → roommate accepts → front desk applies)
CREATE TABLE IF NOT EXISTS "folio_split_requests" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "folioId" TEXT,
    "fromGuestId" TEXT NOT NULL,
    "toName" TEXT NOT NULL,
    "toEmail" TEXT,
    "toPhone" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ZAR',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "note" TEXT,
    "respondedAt" TIMESTAMP(3),
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "folio_split_requests_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "folio_split_requests_tenantId_status_idx" ON "folio_split_requests"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "folio_split_requests_reservationId_idx" ON "folio_split_requests"("reservationId");
ALTER TABLE "folio_split_requests" ADD CONSTRAINT "folio_split_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "folio_split_requests" ADD CONSTRAINT "folio_split_requests_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
