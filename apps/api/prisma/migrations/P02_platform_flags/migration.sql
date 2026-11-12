CREATE TABLE IF NOT EXISTS "feature_flags" (
  "id"        TEXT NOT NULL,
  "key"       TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "owner"     TEXT NOT NULL,
  "defaultValue" BOOLEAN NOT NULL DEFAULT false,
  "environment" TEXT NOT NULL DEFAULT 'production',
  "rolloutStrategy" JSONB NOT NULL DEFAULT '{}',
  "status"    TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "feature_flags_key_env_key" ON "feature_flags"("key", "environment");

CREATE TABLE IF NOT EXISTS "feature_flag_overrides" (
  "id"        TEXT NOT NULL,
  "flagId"    TEXT NOT NULL,
  "tenantId"  TEXT,
  "value"     BOOLEAN NOT NULL,
  "cohort"    TEXT,
  "createdBy" TEXT NOT NULL,
  "reason"    TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "feature_flag_overrides_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ffo_flag_fkey" FOREIGN KEY ("flagId") REFERENCES "feature_flags"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ffo_flag_tenant_key" ON "feature_flag_overrides"("flagId", "tenantId");
