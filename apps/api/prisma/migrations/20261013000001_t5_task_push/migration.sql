-- T5: WhatsApp/SMS task push — staff phone + one-tap token columns
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" TEXT;

ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "pushToken" TEXT;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "pushTokenExpiresAt" TIMESTAMP(3);
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "pushChannel" TEXT;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "pushSentAt" TIMESTAMP(3);
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "pushAttempts" INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS "tasks_pushToken_key" ON "tasks"("pushToken");
