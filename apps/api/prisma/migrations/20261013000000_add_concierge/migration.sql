-- CreateTable
CREATE TABLE "concierge_items" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "guestId" TEXT,
    "reservationId" TEXT,
    "roomId" TEXT,
    "assigneeId" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "priceMinor" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'ZAR',
    "flightNumber" TEXT,
    "tripStatus" TEXT,
    "postedToFolio" BOOLEAN NOT NULL DEFAULT false,
    "folioItemId" TEXT,
    "postedAt" TIMESTAMP(3),
    "dedupeKey" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "concierge_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "concierge_items_tenantId_dedupeKey_key" ON "concierge_items"("tenantId", "dedupeKey");
CREATE INDEX "concierge_items_tenantId_status_idx" ON "concierge_items"("tenantId", "status");
CREATE INDEX "concierge_items_propertyId_status_scheduledAt_idx" ON "concierge_items"("propertyId", "status", "scheduledAt");
CREATE INDEX "concierge_items_type_idx" ON "concierge_items"("type");
CREATE INDEX "concierge_items_reservationId_idx" ON "concierge_items"("reservationId");
CREATE INDEX "concierge_items_guestId_idx" ON "concierge_items"("guestId");
CREATE INDEX "concierge_items_folioItemId_idx" ON "concierge_items"("folioItemId");

ALTER TABLE "concierge_items" ADD CONSTRAINT "concierge_items_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "concierge_items" ADD CONSTRAINT "concierge_items_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "concierge_items" ADD CONSTRAINT "concierge_items_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "concierge_items" ADD CONSTRAINT "concierge_items_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "concierge_items" ADD CONSTRAINT "concierge_items_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "concierge_items" ADD CONSTRAINT "concierge_items_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;