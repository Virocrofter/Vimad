CREATE TABLE IF NOT EXISTS "platform_audit_events" (
  "id"            TEXT NOT NULL,
  "actorEmail"    TEXT NOT NULL,
  "action"        TEXT NOT NULL,
  "entity"        TEXT NOT NULL,
  "entityId"      TEXT,
  "tenantId"      TEXT,
  "before"        JSONB,
  "after"         JSONB,
  "reason"        TEXT,
  "source"        TEXT NOT NULL DEFAULT 'console',
  "correlationId" TEXT,
  "ipAddress"     TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "platform_audit_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "pae_actor_createdAt_idx" ON "platform_audit_events"("actorEmail", "createdAt");
CREATE INDEX IF NOT EXISTS "pae_entity_idx" ON "platform_audit_events"("entity", "entityId");
CREATE INDEX IF NOT EXISTS "pae_tenant_createdAt_idx" ON "platform_audit_events"("tenantId", "createdAt");
CREATE TABLE IF NOT EXISTS "platform_operators" (
  "id"           TEXT NOT NULL,
  "email"        TEXT NOT NULL,
  "role"         TEXT NOT NULL DEFAULT 'platform_super_admin',
  "status"       TEXT NOT NULL DEFAULT 'active',
  "grantedBy"    TEXT,
  "grantedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt"    TIMESTAMP(3),
  "revokeReason" TEXT,
  "mfaEnrolled"  BOOLEAN NOT NULL DEFAULT false,
  "lastActiveAt" TIMESTAMP(3),
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "platform_operators_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "platform_operators_email_key" ON "platform_operators"("email");
