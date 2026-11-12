ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "isDemo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "demo_sessions" ADD COLUMN IF NOT EXISTS "company" TEXT;
ALTER TABLE "demo_sessions" ADD COLUMN IF NOT EXISTS "hotelName" TEXT;
ALTER TABLE "demo_sessions" ADD COLUMN IF NOT EXISTS "roomCount" INTEGER;
ALTER TABLE "demo_sessions" ADD COLUMN IF NOT EXISTS "currentPms" TEXT;
ALTER TABLE "demo_sessions" ADD COLUMN IF NOT EXISTS "preferredSlot" TEXT;
ALTER TABLE "demo_sessions" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "demo_sessions" ADD COLUMN IF NOT EXISTS "firstLoginAt" TIMESTAMP(3);
ALTER TABLE "demo_sessions" ADD COLUMN IF NOT EXISTS "lastActivityAt" TIMESTAMP(3);
ALTER TABLE "demo_sessions" ADD COLUMN IF NOT EXISTS "activityCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "demo_sessions" ADD COLUMN IF NOT EXISTS "convertedAt" TIMESTAMP(3);
ALTER TABLE "demo_sessions" ADD COLUMN IF NOT EXISTS "extendedCount" INTEGER NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS "demo_invites" (
    "id" TEXT NOT NULL, "sessionId" TEXT NOT NULL, "tokenHash" TEXT NOT NULL,
    "tokenPrefix" TEXT NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL, "usedAt" TIMESTAMP(3),
    "createdBy" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "demo_invites_pkey" PRIMARY KEY ("id"));
CREATE INDEX IF NOT EXISTS "demo_invites_sessionId_idx" ON "demo_invites"("sessionId");
CREATE INDEX IF NOT EXISTS "demo_invites_tokenHash_idx" ON "demo_invites"("tokenHash");
CREATE TABLE IF NOT EXISTS "demo_activity" (
    "id" TEXT NOT NULL, "sessionId" TEXT NOT NULL, "tenantId" TEXT, "actor" TEXT,
    "action" TEXT NOT NULL, "detail" TEXT, "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "demo_activity_pkey" PRIMARY KEY ("id"));
CREATE INDEX IF NOT EXISTS "demo_activity_sessionId_idx" ON "demo_activity"("sessionId", "createdAt");
INSERT INTO permissions (id, resource, action, description, category)
SELECT gen_random_uuid(), 'demo_access', 'view', 'View demo access queue, sessions and engagement', 'platform'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE resource='demo_access' AND action='view');
INSERT INTO permissions (id, resource, action, description, category)
SELECT gen_random_uuid(), 'demo_access', 'manage', 'Approve, invite, extend, convert, reset and revoke demo sessions', 'platform'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE resource='demo_access' AND action='manage');
