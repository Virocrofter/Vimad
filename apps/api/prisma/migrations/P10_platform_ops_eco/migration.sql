CREATE TABLE IF NOT EXISTS "incidents" (
  "id" TEXT NOT NULL, "severity" TEXT NOT NULL, "title" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'investigating',
  "affectedTenantIds" JSONB NOT NULL DEFAULT '[]', "timeline" JSONB NOT NULL DEFAULT '[]',
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "resolvedAt" TIMESTAMP(3),
  "createdBy" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "incidents_pkey" PRIMARY KEY ("id"));
CREATE TABLE IF NOT EXISTS "webhook_deliveries" (
  "id" TEXT NOT NULL, "connectionId" TEXT NOT NULL, "event" TEXT NOT NULL,
  "payloadHash" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'queued',
  "attempts" INTEGER NOT NULL DEFAULT 0, "lastError" TEXT, "deliveredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id"));
CREATE INDEX IF NOT EXISTS "wd_status_idx" ON "webhook_deliveries"("status", "createdAt");
CREATE TABLE IF NOT EXISTS "platform_announcements" (
  "id" TEXT NOT NULL, "title" TEXT NOT NULL, "body" TEXT NOT NULL,
  "audience" TEXT NOT NULL DEFAULT 'all_operators', "status" TEXT NOT NULL DEFAULT 'draft',
  "publishAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "platform_announcements_pkey" PRIMARY KEY ("id"));
CREATE TABLE IF NOT EXISTS "api_clients" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "contactEmail" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "api_clients_pkey" PRIMARY KEY ("id"));
CREATE TABLE IF NOT EXISTS "integration_catalog" (
  "key" TEXT NOT NULL, "name" TEXT NOT NULL, "category" TEXT NOT NULL,
  "availability" TEXT NOT NULL DEFAULT 'planned', "notes" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "integration_catalog_pkey" PRIMARY KEY ("key"));
INSERT INTO "integration_catalog" ("key","name","category","availability","notes","updatedAt") VALUES
  ('booking_com','Booking.com','channel','pilot','Adapter coverage expanding',now()),
  ('expedia','Expedia','channel','planned','',now()),
  ('paystack','Paystack','payments','available','Live',now()),
  ('twilio_sms','Twilio SMS','messaging','available','Live',now()),
  ('xero','Xero export','accounting','planned','Pending SARS format review',now())
ON CONFLICT ("key") DO NOTHING;
