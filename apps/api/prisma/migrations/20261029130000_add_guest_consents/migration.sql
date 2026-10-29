-- E5: purpose-specific guest consent. Append-only: every grant/revoke is a
-- row; the newest capturedAt per (guestId, purpose, channel) is the verdict.
CREATE TABLE IF NOT EXISTS "guest_consents" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'marketing',
    "channel" TEXT NOT NULL DEFAULT 'email',
    "status" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "guest_consents_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "guest_consents_guest_purpose_idx" ON "guest_consents"("guestId", "purpose", "channel", "capturedAt");
CREATE INDEX IF NOT EXISTS "guest_consents_tenant_idx" ON "guest_consents"("tenantId");
