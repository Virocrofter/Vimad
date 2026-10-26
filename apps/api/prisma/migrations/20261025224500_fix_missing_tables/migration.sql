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
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "source" TEXT NOT NULL DEFAULT 'tenant',
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
    "authorType" TEXT NOT NULL,
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
CREATE TABLE IF NOT EXISTS "MarketingCampaign" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "segmentId" TEXT,
    "budget" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "spend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingCampaign_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "MarketingEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "device" TEXT NOT NULL,
    "segmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketingEvent_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "MarketingWorkflow" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trigger" TEXT NOT NULL,
    "actions" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "lastRunAt" TIMESTAMP(3),
    "runCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingWorkflow_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "MarketingWorkflowRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'success',
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketingWorkflowRun_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "MarketingTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "tags" TEXT[],
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingTemplate_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "MarketingSegment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "criteria" JSONB NOT NULL,
    "guestCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingSegment_pkey" PRIMARY KEY ("id")
);
