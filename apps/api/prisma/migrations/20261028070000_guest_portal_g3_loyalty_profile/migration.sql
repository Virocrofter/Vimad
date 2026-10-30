-- G3: Guest loyalty rewards + redemptions, and document verification status
ALTER TABLE "guest_documents" ADD COLUMN IF NOT EXISTS "verificationStatus" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "guest_documents" ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3);
ALTER TABLE "guest_documents" ADD COLUMN IF NOT EXISTS "verifiedById" TEXT;

CREATE TABLE IF NOT EXISTS "loyalty_rewards" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pointsCost" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "loyalty_rewards_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "loyalty_rewards_tenantId_status_idx" ON "loyalty_rewards"("tenantId", "status");

CREATE TABLE IF NOT EXISTS "loyalty_redemptions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "reservationId" TEXT,
    "rewardId" TEXT NOT NULL,
    "rewardName" TEXT NOT NULL,
    "pointsCost" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "idempotencyKey" TEXT,
    "conciergeItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "loyalty_redemptions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "loyalty_redemptions_idempotencyKey_key" ON "loyalty_redemptions"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "loyalty_redemptions_tenantId_guestId_idx" ON "loyalty_redemptions"("tenantId", "guestId");

ALTER TABLE "loyalty_rewards" ADD CONSTRAINT "loyalty_rewards_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "loyalty_redemptions" ADD CONSTRAINT "loyalty_redemptions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "loyalty_redemptions" ADD CONSTRAINT "loyalty_redemptions_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "loyalty_redemptions" ADD CONSTRAINT "loyalty_redemptions_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "loyalty_redemptions" ADD CONSTRAINT "loyalty_redemptions_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "loyalty_rewards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "loyalty_redemptions" ADD CONSTRAINT "loyalty_redemptions_conciergeItemId_fkey" FOREIGN KEY ("conciergeItemId") REFERENCES "concierge_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Demo catalog (guarded — only for the demo tenant)
INSERT INTO "loyalty_rewards" ("id", "tenantId", "name", "description", "pointsCost", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, t.id, v.name, v.description, v.cost, now(), now()
FROM tenants t
CROSS JOIN (VALUES
  ('Welcome Drink Voucher', 'A welcome drink at the lobby bar on your next visit', 500),
  ('Late Checkout (2 PM)', 'Stretch your departure until 2 PM, subject to availability', 1500),
  ('Free Room Upgrade', 'One-category upgrade at check-in, subject to availability', 2000),
  ('Presidential Dinner For Two', 'Chef''s table dinner for two with wine pairing', 9000)
) AS v(name, description, cost)
WHERE t.slug = 'demo-hotel'
  AND NOT EXISTS (SELECT 1 FROM "loyalty_rewards" lr WHERE lr."tenantId" = t.id AND lr.name = v.name);
