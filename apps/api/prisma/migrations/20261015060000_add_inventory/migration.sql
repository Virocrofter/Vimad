CREATE TABLE "inventory_restrictions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "roomTypeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "stopSell" BOOLEAN NOT NULL DEFAULT false,
    "closeToArrival" BOOLEAN NOT NULL DEFAULT false,
    "closeToDeparture" BOOLEAN NOT NULL DEFAULT false,
    "adjustment" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "inventory_restrictions_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "inventory_allocations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "roomTypeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "reservationId" TEXT,
    "notes" TEXT,
    "dedupeKey" TEXT,
    "createdById" TEXT,
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "inventory_allocations_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "inventory_overbooking" (
    "roomTypeId" TEXT NOT NULL,
    "limit" INTEGER NOT NULL DEFAULT 0,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "inventory_overbooking_pkey" PRIMARY KEY ("roomTypeId")
);
CREATE UNIQUE INDEX "inventory_restrictions_roomTypeId_date_key" ON "inventory_restrictions"("roomTypeId", "date");
CREATE INDEX "inventory_restrictions_tenantId_propertyId_date_idx" ON "inventory_restrictions"("tenantId", "propertyId", "date");
CREATE UNIQUE INDEX "inventory_allocations_tenantId_dedupeKey_key" ON "inventory_allocations"("tenantId", "dedupeKey");
CREATE INDEX "inventory_allocations_roomTypeId_date_idx" ON "inventory_allocations"("roomTypeId", "date");
CREATE INDEX "inventory_allocations_tenantId_status_idx" ON "inventory_allocations"("tenantId", "status");
ALTER TABLE "inventory_restrictions" ADD CONSTRAINT "inventory_restrictions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_restrictions" ADD CONSTRAINT "inventory_restrictions_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_restrictions" ADD CONSTRAINT "inventory_restrictions_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "room_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_allocations" ADD CONSTRAINT "inventory_allocations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_allocations" ADD CONSTRAINT "inventory_allocations_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_allocations" ADD CONSTRAINT "inventory_allocations_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "room_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_overbooking" ADD CONSTRAINT "inventory_overbooking_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "room_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO permissions (id, resource, action, description, category)
SELECT gen_random_uuid(), v.resource, v.action, v.description, 'inventory'
FROM (VALUES
  ('inventory','view','View room inventory grid, holds and restrictions'),
  ('inventory','adjust','Set stop-sell, CTA/CTD, adjustments, holds and overbooking')
) AS v(resource, action, description)
ON CONFLICT (resource, action) DO NOTHING;

INSERT INTO role_permissions (id, "roleId", "permissionId")
SELECT gen_random_uuid(), r.id, p.id
FROM roles r JOIN permissions p ON p.resource = 'inventory'
WHERE r."tenantId" IS NULL AND r.name IN ('Owner','Admin','Manager')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

INSERT INTO role_permissions (id, "roleId", "permissionId")
SELECT gen_random_uuid(), r.id, p.id
FROM roles r JOIN permissions p ON p.resource = 'inventory' AND p.action = 'view'
WHERE r."tenantId" IS NULL AND r.name IN ('Staff','Housekeeper')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
