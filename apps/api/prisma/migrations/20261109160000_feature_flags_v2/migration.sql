-- Feature Flags v2 — industry-grade rebuild (2026-11-09)
-- Adds typed values, variants, failMode, protected, rollout engine columns,
-- segment targeting, kill switch and the impressions table.
ALTER TABLE "feature_flags" ADD COLUMN IF NOT EXISTS "valueType" TEXT NOT NULL DEFAULT 'boolean';
ALTER TABLE "feature_flags" ADD COLUMN IF NOT EXISTS "defaultValueJsonb" JSONB;
ALTER TABLE "feature_flags" ADD COLUMN IF NOT EXISTS "variants" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "feature_flags" ADD COLUMN IF NOT EXISTS "failMode" TEXT NOT NULL DEFAULT 'closed';
ALTER TABLE "feature_flags" ADD COLUMN IF NOT EXISTS "protected" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "feature_flags" ADD COLUMN IF NOT EXISTS "rolloutPct" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "feature_flags" ADD COLUMN IF NOT EXISTS "segmentRules" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "feature_flags" ADD COLUMN IF NOT EXISTS "killReason" TEXT;
ALTER TABLE "feature_flags" ADD COLUMN IF NOT EXISTS "killedAt" TIMESTAMP(3);
ALTER TABLE "feature_flags" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "feature_flags" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE "feature_flags" SET "defaultValueJsonb" = to_jsonb("defaultValue") WHERE "defaultValueJsonb" IS NULL;
CREATE TABLE IF NOT EXISTS "flag_impressions" (
    "id" TEXT NOT NULL,
    "flagId" TEXT NOT NULL,
    "flagKey" TEXT NOT NULL,
    "tenantId" TEXT,
    "onState" BOOLEAN NOT NULL DEFAULT true,
    "error" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "flag_impressions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "flag_impressions_flag_created_idx" ON "flag_impressions"("flagId", "createdAt");
CREATE INDEX IF NOT EXISTS "flag_impressions_tenant_created_idx" ON "flag_impressions"("tenantId", "createdAt");
