CREATE TABLE "parking_bays" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "zone" TEXT NOT NULL DEFAULT 'standard',
    "status" TEXT NOT NULL DEFAULT 'available',
    "evCharger" BOOLEAN NOT NULL DEFAULT false,
    "chargingStatus" TEXT NOT NULL DEFAULT 'free',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "parking_bays_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "guest_vehicles" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "plate" TEXT NOT NULL,
    "make" TEXT,
    "model" TEXT,
    "color" TEXT,
    "isElectric" BOOLEAN NOT NULL DEFAULT false,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "guest_vehicles_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "parking_assignments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "bayId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "reservationId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "valet" BOOLEAN NOT NULL DEFAULT false,
    "valetInstructions" TEXT,
    "valetKeyLocation" TEXT,
    "plateAtCheckin" TEXT,
    "assignedBy" TEXT,
    "scheduledFor" DATE NOT NULL,
    "checkedInAt" TIMESTAMP(3),
    "checkedOutAt" TIMESTAMP(3),
    "dedupeKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "parking_assignments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "parking_bays_propertyId_label_key" ON "parking_bays"("propertyId", "label");
CREATE INDEX "parking_bays_tenantId_idx" ON "parking_bays"("tenantId");
CREATE INDEX "parking_bays_propertyId_status_idx" ON "parking_bays"("propertyId", "status");
CREATE UNIQUE INDEX "guest_vehicles_tenantId_plate_key" ON "guest_vehicles"("tenantId", "plate");
CREATE INDEX "guest_vehicles_guestId_idx" ON "guest_vehicles"("guestId");
CREATE UNIQUE INDEX "parking_assignments_tenantId_dedupeKey_key" ON "parking_assignments"("tenantId", "dedupeKey");
CREATE INDEX "parking_assignments_tenantId_status_idx" ON "parking_assignments"("tenantId", "status");
CREATE INDEX "parking_assignments_propertyId_status_scheduledFor_idx" ON "parking_assignments"("propertyId", "status", "scheduledFor");
CREATE INDEX "parking_assignments_vehicleId_idx" ON "parking_assignments"("vehicleId");
CREATE INDEX "parking_assignments_reservationId_idx" ON "parking_assignments"("reservationId");
ALTER TABLE "parking_bays" ADD CONSTRAINT "parking_bays_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "parking_bays" ADD CONSTRAINT "parking_bays_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "guest_vehicles" ADD CONSTRAINT "guest_vehicles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "guest_vehicles" ADD CONSTRAINT "guest_vehicles_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "parking_assignments" ADD CONSTRAINT "parking_assignments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "parking_assignments" ADD CONSTRAINT "parking_assignments_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "parking_assignments" ADD CONSTRAINT "parking_assignments_bayId_fkey" FOREIGN KEY ("bayId") REFERENCES "parking_bays"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "parking_assignments" ADD CONSTRAINT "parking_assignments_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "guest_vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
