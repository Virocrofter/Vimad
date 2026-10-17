-- CreateTable
CREATE TABLE "minibar_checks" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "reservationId" TEXT,
    "folioItemId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'logged',
    "items" JSONB NOT NULL DEFAULT '[]',
    "totalMinor" INTEGER NOT NULL DEFAULT 0,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "note" TEXT,
    "loggedById" TEXT,
    "postedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "minibar_checks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "minibar_checks_tenantId_createdAt_idx" ON "minibar_checks"("tenantId", "createdAt");
CREATE INDEX "minibar_checks_roomId_idx" ON "minibar_checks"("roomId");
CREATE INDEX "minibar_checks_reservationId_idx" ON "minibar_checks"("reservationId");
CREATE INDEX "minibar_checks_status_idx" ON "minibar_checks"("status");

ALTER TABLE "minibar_checks" ADD CONSTRAINT "minibar_checks_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "minibar_checks" ADD CONSTRAINT "minibar_checks_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "minibar_checks" ADD CONSTRAINT "minibar_checks_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "minibar_checks" ADD CONSTRAINT "minibar_checks_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "minibar_checks" ADD CONSTRAINT "minibar_checks_loggedById_fkey" FOREIGN KEY ("loggedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;