-- Production profiler: snapshots, slow-query capture, tenant cost attribution
CREATE TABLE IF NOT EXISTS "profiler_query_snapshots" (
    "id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "calls" INTEGER NOT NULL DEFAULT 0,
    "totalTimeMs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "meanTimeMs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rows" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "profiler_query_snapshots_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "profiler_query_snapshots_fp_cap_idx" ON "profiler_query_snapshots"("fingerprint", "capturedAt");

CREATE TABLE IF NOT EXISTS "profiler_slow_queries" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "route" TEXT,
    "query" TEXT NOT NULL,
    "durationMs" DOUBLE PRECISION NOT NULL,
    "rows" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "profiler_slow_queries_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "profiler_slow_queries_tenant_created_idx" ON "profiler_slow_queries"("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "profiler_slow_queries_createdAt_idx" ON "profiler_slow_queries"("createdAt");

CREATE TABLE IF NOT EXISTS "profiler_tenant_costs" (
    "tenantId" TEXT NOT NULL,
    "queries" INTEGER NOT NULL DEFAULT 0,
    "totalTimeMs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "slowQueries" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "profiler_tenant_costs_pkey" PRIMARY KEY ("tenantId")
);
