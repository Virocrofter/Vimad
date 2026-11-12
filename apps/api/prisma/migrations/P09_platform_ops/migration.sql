CREATE TABLE IF NOT EXISTS "backup_runs" (
  "id" TEXT NOT NULL, "kind" TEXT NOT NULL, "status" TEXT NOT NULL,
  "destination" TEXT NOT NULL, "sizeBytes" BIGINT, "checksum" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3), "actor" TEXT,
  "restoreTestedAt" TIMESTAMP(3), "restoreTestStatus" TEXT, "restoreTestLog" TEXT,
  CONSTRAINT "backup_runs_pkey" PRIMARY KEY ("id"));
CREATE TABLE IF NOT EXISTS "demo_sessions" (
  "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "requesterEmail" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending', "grantedBy" TEXT,
  "activatedAt" TIMESTAMP(3), "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3), "revokeReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "demo_sessions_pkey" PRIMARY KEY ("id"));
CREATE TABLE IF NOT EXISTS "feedback_entries" (
  "id" TEXT NOT NULL, "tenantId" TEXT, "source" TEXT NOT NULL DEFAULT 'admin',
  "npsScore" INTEGER, "body" TEXT, "category" TEXT NOT NULL DEFAULT 'general',
  "status" TEXT NOT NULL DEFAULT 'new', "assignee" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "feedback_entries_pkey" PRIMARY KEY ("id"));
