-- Backups & DR — production-grade program (bulk install 2026-11-04)
CREATE TABLE IF NOT EXISTS "backup_schedules" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'full',
  "cron" TEXT NOT NULL,
  "timezone" TEXT NOT NULL DEFAULT 'UTC',
  "tables" JSONB NOT NULL DEFAULT '[]',
  "retentionDays" INTEGER NOT NULL DEFAULT 30,
  "storage" TEXT NOT NULL DEFAULT 'local',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastRunAt" TIMESTAMP(3),
  "nextRunAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "backup_schedules_nextRunAt_idx" ON "backup_schedules"("nextRunAt");

CREATE TABLE IF NOT EXISTS "dr_restore_jobs" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "backupId" TEXT NOT NULL,
  "target" TEXT NOT NULL DEFAULT 'scratch',
  "verify" BOOLEAN NOT NULL DEFAULT true,
  "tables" JSONB NOT NULL DEFAULT '[]',
  "status" TEXT NOT NULL DEFAULT 'running',
  "checks" JSONB,
  "error" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3),
  "durationMs" INTEGER,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "dr_restore_jobs_backupId_idx" ON "dr_restore_jobs"("backupId");

CREATE TABLE IF NOT EXISTS "dr_drills" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "status" TEXT NOT NULL DEFAULT 'running',
  "backupId" TEXT,
  "rtoSeconds" INTEGER,
  "checks" JSONB,
  "notes" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3)
);

CREATE TABLE IF NOT EXISTS "backup_settings" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "rpoTargetMinutes" INTEGER NOT NULL DEFAULT 1440,
  "rtoTargetHours" INTEGER NOT NULL DEFAULT 4,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "backup_settings" ("id","rpoTargetMinutes","rtoTargetHours","updatedAt")
VALUES ('default', 1440, 4, now()) ON CONFLICT ("id") DO NOTHING;

ALTER TABLE "backup_runs" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "backup_runs" ADD COLUMN IF NOT EXISTS "type" TEXT;
ALTER TABLE "backup_runs" ADD COLUMN IF NOT EXISTS "tables" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "backup_runs" ADD COLUMN IF NOT EXISTS "retentionDays" INTEGER NOT NULL DEFAULT 30;
ALTER TABLE "backup_runs" ADD COLUMN IF NOT EXISTS "storage" TEXT NOT NULL DEFAULT 'local';
ALTER TABLE "backup_runs" ADD COLUMN IF NOT EXISTS "verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "backup_runs" ADD COLUMN IF NOT EXISTS "error" TEXT;
