ALTER TABLE "rooms" ADD COLUMN IF NOT EXISTS "serviceStatus" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "rooms" ADD COLUMN IF NOT EXISTS "serviceReason" TEXT;
ALTER TABLE "rooms" ADD COLUMN IF NOT EXISTS "parentRoomId" TEXT;
ALTER TABLE "rooms" ADD COLUMN IF NOT EXISTS "statusChangedAt" TIMESTAMP(3);
ALTER TABLE "rooms" ADD COLUMN IF NOT EXISTS "statusChangedBy" TEXT;
CREATE INDEX IF NOT EXISTS "rooms_propertyId_serviceStatus_idx" ON "rooms"("propertyId", "serviceStatus");
CREATE TABLE IF NOT EXISTS "room_status_events" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "from" TEXT,
    "to" TEXT NOT NULL,
    "reason" TEXT,
    "note" TEXT,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "room_status_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "room_status_events_tenantId_propertyId_createdAt_idx" ON "room_status_events"("tenantId", "propertyId", "createdAt");
CREATE INDEX IF NOT EXISTS "room_status_events_roomId_createdAt_idx" ON "room_status_events"("roomId", "createdAt");

-- T2+ auto-status rules (rules-as-rows; evaluated by housekeeping.job.ts)
INSERT INTO task_rules (id, "tenantId", key, name, department, description, trigger, conditions, action, config, "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid(), t.id, 'hk-stagnant-vacant', 'Stagnant room refresh', 'housekeeping',
 'Rooms clean/ready with no stay and no open task for N days go dirty for a refresh',
 '{"type":"interval","minutes":30}'::jsonb,
 '{"vacantGteDays":7,"fromStatuses":["clean","ready"]}'::jsonb,
 '{"kind":"hk_status_stagnant","to":"dirty"}'::jsonb,
 '{}'::jsonb, true, now(), now()
FROM tenants t
ON CONFLICT ("tenantId", key) DO NOTHING;

INSERT INTO task_rules (id, "tenantId", key, name, department, description, trigger, conditions, action, config, "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid(), t.id, 'hk-inspected-overnight', 'Inspected to clean overnight', 'housekeeping',
 'Rooms inspected during the day flip to clean at 04:30 so arrivals see a clean grid',
 '{"type":"cron","at":"04:30"}'::jsonb,
 '{"fromStatuses":["inspected"]}'::jsonb,
 '{"kind":"hk_status_overnight","to":"clean"}'::jsonb,
 '{}'::jsonb, true, now(), now()
FROM tenants t
ON CONFLICT ("tenantId", key) DO NOTHING;
