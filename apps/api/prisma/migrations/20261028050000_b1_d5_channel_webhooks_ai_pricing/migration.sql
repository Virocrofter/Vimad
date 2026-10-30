CREATE TABLE IF NOT EXISTS "channel_push_log" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ok',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "channel_push_log_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "channel_push_log_connectionId_createdAt_idx" ON "channel_push_log"("connectionId", "createdAt");
CREATE TABLE IF NOT EXISTS "pricing_suggestions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "roomTypeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "currentRate" DECIMAL(10,2) NOT NULL,
    "suggestedRate" DECIMAL(10,2) NOT NULL,
    "occupancyPct" DECIMAL(5,2) NOT NULL,
    "rationale" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pricing_suggestions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "pricing_suggestions_roomTypeId_date_key" ON "pricing_suggestions"("roomTypeId", "date");
CREATE INDEX IF NOT EXISTS "pricing_suggestions_tenantId_status_idx" ON "pricing_suggestions"("tenantId", "status");
