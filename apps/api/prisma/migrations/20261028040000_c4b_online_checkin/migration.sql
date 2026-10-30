CREATE TABLE IF NOT EXISTS "guest_checkin_sessions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'started',
    "idDocType" TEXT,
    "idDocNumber" TEXT,
    "idDocKey" TEXT,
    "selfieKey" TEXT,
    "signatureKey" TEXT,
    "depositRequired" BOOLEAN NOT NULL DEFAULT false,
    "depositAmount" DECIMAL(10,2),
    "depositReference" TEXT,
    "completedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "guest_checkin_sessions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "guest_checkin_sessions_reservationId_key" ON "guest_checkin_sessions"("reservationId");
CREATE INDEX IF NOT EXISTS "guest_checkin_sessions_tenantId_status_idx" ON "guest_checkin_sessions"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "guest_checkin_sessions_propertyId_status_idx" ON "guest_checkin_sessions"("propertyId", "status");
