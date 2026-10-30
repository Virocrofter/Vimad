ALTER TABLE "rate_plans" ADD COLUMN IF NOT EXISTS "parentRatePlanId" TEXT;
CREATE TABLE IF NOT EXISTS "vouchers" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discountPercent" INTEGER NOT NULL,
    "maxUses" INTEGER NOT NULL DEFAULT 100,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vouchers_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "vouchers_code_key" ON "vouchers"("code");
CREATE TABLE IF NOT EXISTS "rate_restriction_suggestions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "roomTypeId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'stop_sell',
    "reason" TEXT,
    "ruleId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rate_restriction_suggestions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "rate_restriction_suggestions_roomTypeId_date_kind_key" ON "rate_restriction_suggestions"("roomTypeId", "date", "kind");
CREATE INDEX IF NOT EXISTS "rate_restriction_suggestions_propertyId_status_idx" ON "rate_restriction_suggestions"("propertyId", "status");
