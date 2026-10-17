-- SUPPORT: guest/staff ticketing with SLA, escalation, CSAT

CREATE TABLE "ticket_counters" (
    "tenantId" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ticket_counters_pkey" PRIMARY KEY ("tenantId")
);

CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT,
    "guestId" TEXT,
    "reservationId" TEXT,
    "number" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'guest_portal', -- guest_portal | staff | email
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',    -- billing | housekeeping | maintenance | technology | room_service | concierge | general
    "status" TEXT NOT NULL DEFAULT 'open',         -- open | in_progress | waiting_guest | resolved | closed
    "priority" TEXT NOT NULL DEFAULT 'medium',     -- low | medium | high | urgent
    "assigneeId" TEXT,
    "createdById" TEXT,
    "slaResponseDueAt" TIMESTAMP(3),
    "slaResolveDueAt" TIMESTAMP(3),
    "firstResponseAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "slaBreached" BOOLEAN NOT NULL DEFAULT false,
    "escalationLevel" INTEGER NOT NULL DEFAULT 0,  -- 0 none | 1 breached | 2 escalated-to-management
    "satisfactionRating" INTEGER,
    "satisfactionComment" TEXT,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ticket_messages" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "authorType" TEXT NOT NULL,                    -- guest | staff | system
    "authorId" TEXT,
    "authorName" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,   -- staff-only note — never visible to guest
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ticket_messages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tickets_tenantId_number_key" ON "tickets"("tenantId", "number");
CREATE INDEX "tickets_tenantId_status_idx" ON "tickets"("tenantId", "status");
CREATE INDEX "tickets_tenantId_priority_idx" ON "tickets"("tenantId", "priority");
CREATE INDEX "tickets_tenantId_assigneeId_status_idx" ON "tickets"("tenantId", "assigneeId", "status");
CREATE INDEX "tickets_guestId_idx" ON "tickets"("guestId");
CREATE INDEX "tickets_propertyId_idx" ON "tickets"("propertyId");
CREATE INDEX "tickets_slaResponseDueAt_idx" ON "tickets"("slaResponseDueAt");
CREATE INDEX "tickets_slaResolveDueAt_idx" ON "tickets"("slaResolveDueAt");
CREATE INDEX "ticket_messages_ticketId_createdAt_idx" ON "ticket_messages"("ticketId", "createdAt");

ALTER TABLE "ticket_counters" ADD CONSTRAINT "ticket_counters_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Permissions
INSERT INTO permissions (id, resource, action, description, category)
SELECT gen_random_uuid(), v.resource, v.action, v.description, 'support'
FROM (VALUES
  ('ticket','read','View support tickets and threads'),
  ('ticket','update','Reply, change status, assign tickets'),
  ('ticket','manage','Create/edit/delete tickets and see internal notes')
) AS v(resource, action, description)
ON CONFLICT (resource, action) DO NOTHING;

INSERT INTO role_permissions (id, "roleId", "permissionId")
SELECT gen_random_uuid(), r.id, p.id
FROM roles r JOIN permissions p ON p.resource = 'ticket'
WHERE r."tenantId" IS NULL AND r.name IN ('Owner','Admin','Manager')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

INSERT INTO role_permissions (id, "roleId", "permissionId")
SELECT gen_random_uuid(), r.id, p.id
FROM roles r JOIN permissions p ON p.resource = 'ticket' AND p.action IN ('read','update')
WHERE r."tenantId" IS NULL AND r.name IN ('Staff','Housekeeper')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;