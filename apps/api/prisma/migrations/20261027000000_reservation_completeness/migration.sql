ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "ratePlanId" TEXT;
ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "eta" TEXT;
ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "checkedInAt" TIMESTAMP(3);
ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "checkedOutAt" TIMESTAMP(3);
ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "checkedInBy" TEXT;
ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "checkedOutBy" TEXT;
ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP(3);
ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "cancelledBy" TEXT;
ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "cancelReason" TEXT;
ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "noShowAt" TIMESTAMP(3);
ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "depositDue" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "depositPaid" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "marketSegment" TEXT;
ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "specialRequests" TEXT;
ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "doNotMove" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "fixedRoom" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "houseUse" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "guaranteed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "confirmationSentAt" TIMESTAMP(3);
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_ratePlanId_fkey" FOREIGN KEY ("ratePlanId") REFERENCES "rate_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "reservations_ratePlanId_idx" ON "reservations"("ratePlanId");
CREATE INDEX IF NOT EXISTS "reservations_tenantId_arrivalDate_idx" ON "reservations"("tenantId", "arrivalDate");
CREATE TABLE IF NOT EXISTS "reservation_traces" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "department" TEXT NOT NULL DEFAULT 'front_desk',
    "dueAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "reservation_traces_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "reservation_traces_tenantId_reservationId_idx" ON "reservation_traces"("tenantId", "reservationId");
CREATE INDEX IF NOT EXISTS "reservation_traces_tenantId_dueAt_idx" ON "reservation_traces"("tenantId", "dueAt");
ALTER TABLE "reservation_traces" ADD CONSTRAINT "reservation_traces_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reservation_traces" ADD CONSTRAINT "reservation_traces_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE TABLE IF NOT EXISTS "reservation_companions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "guestId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "relationship" TEXT,
    "sharesFolio" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reservation_companions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "reservation_companions_tenantId_reservationId_idx" ON "reservation_companions"("tenantId", "reservationId");
ALTER TABLE "reservation_companions" ADD CONSTRAINT "reservation_companions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reservation_companions" ADD CONSTRAINT "reservation_companions_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reservation_companions" ADD CONSTRAINT "reservation_companions_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
INSERT INTO permissions (id, resource, action, description, category)
SELECT gen_random_uuid(), v.resource, v.action, v.description, 'reservations'
FROM (VALUES
  ('reservation','cancel','Cancel reservations'),
  ('reservation','no_show','Mark reservations as no-show'),
  ('reservation','move','Move a reservation between rooms'),
  ('reservation','trace','Manage reservation traces')
) AS v(resource, action, description)
ON CONFLICT (resource, action) DO NOTHING;
INSERT INTO role_permissions (id, "roleId", "permissionId")
SELECT gen_random_uuid(), r.id, p.id
FROM roles r JOIN permissions p ON p.resource = 'reservation' AND p.action IN ('cancel','no_show','move','trace')
WHERE r."tenantId" IS NULL AND r.name IN ('Owner','Admin','Manager')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
INSERT INTO role_permissions (id, "roleId", "permissionId")
SELECT gen_random_uuid(), r.id, p.id
FROM roles r JOIN permissions p ON p.resource = 'reservation' AND p.action IN ('cancel','move')
WHERE r."tenantId" IS NULL AND r.name IN ('Staff')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
