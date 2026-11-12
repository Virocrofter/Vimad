-- Production-grade system health: dead-man's switch + synthetic probes
CREATE TABLE IF NOT EXISTS "scheduler_heartbeats" (
    "name" TEXT NOT NULL,
    "ranAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "itemsProcessed" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "scheduler_heartbeats_pkey" PRIMARY KEY ("name")
);
CREATE INDEX IF NOT EXISTS "scheduler_heartbeats_ranAt_idx" ON "scheduler_heartbeats"("ranAt");

CREATE TABLE IF NOT EXISTS "health_checks" (
    "id" TEXT NOT NULL,
    "probe" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pass',
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "detail" TEXT,
    "error" TEXT,
    "ranAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "health_checks_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "health_checks_probe_ranAt_idx" ON "health_checks"("probe", "ranAt");
