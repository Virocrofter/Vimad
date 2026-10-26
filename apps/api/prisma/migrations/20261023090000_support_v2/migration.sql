-- SUPPORT V2: canned responses (hotel staff) + platform support cases (hotel → VIMAD)

CREATE TABLE IF NOT EXISTS "canned_responses" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortcut" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "body" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "canned_responses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "support_cases" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "number" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "status" TEXT NOT NULL DEFAULT 'open',         -- open | in_progress | pending | resolved | closed
    "priority" TEXT NOT NULL DEFAULT 'medium',     -- low | medium | high | critical
    "source" TEXT NOT NULL DEFAULT 'tenant',       -- tenant | system | internal
    "assigneeId" TEXT,
    "createdById" TEXT,
    "slaResponseDueAt" TIMESTAMP(3),
    "slaResolveDueAt" TIMESTAMP(3),
    "firstResponseAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "satisfactionRating" INTEGER,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "support_cases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "support_case_messages" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "authorType" TEXT NOT NULL,                    -- tenant_staff | vimad_staff | system
    "authorId" TEXT,
    "authorName" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "support_case_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "support_case_counters" (
    "key" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "support_case_counters_pkey" PRIMARY KEY ("key")
);

-- Foreign keys
ALTER TABLE "canned_responses" ADD CONSTRAINT "canned_responses_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "canned_responses" ADD CONSTRAINT "canned_responses_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "support_cases" ADD CONSTRAINT "support_cases_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "support_cases" ADD CONSTRAINT "support_cases_assigneeId_fkey"
    FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "support_cases" ADD CONSTRAINT "support_cases_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "support_case_messages" ADD CONSTRAINT "support_case_messages_caseId_fkey"
    FOREIGN KEY ("caseId") REFERENCES "support_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Indexes (names match schema.prisma @@index/@@unique declarations)
CREATE INDEX IF NOT EXISTS "canned_responses_tenantId_category_idx" ON "canned_responses"("tenantId", "category");
CREATE UNIQUE INDEX IF NOT EXISTS "support_cases_number_key" ON "support_cases"("number");
CREATE INDEX IF NOT EXISTS "support_cases_tenantId_status_idx" ON "support_cases"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "support_cases_status_priority_idx" ON "support_cases"("status", "priority");
CREATE INDEX IF NOT EXISTS "support_cases_assigneeId_status_idx" ON "support_cases"("assigneeId", "status");
CREATE INDEX IF NOT EXISTS "support_case_messages_caseId_createdAt_idx" ON "support_case_messages"("caseId", "createdAt");
