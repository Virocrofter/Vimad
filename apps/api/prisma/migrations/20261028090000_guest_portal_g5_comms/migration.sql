-- G5: Guest chat threads/messages, reviews, announcements + permission
CREATE TABLE IF NOT EXISTS "chat_threads" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "assignedToId" TEXT,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unreadForStaff" INTEGER NOT NULL DEFAULT 0,
    "unreadForGuest" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "chat_threads_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "chat_threads_reservationId_key" ON "chat_threads"("reservationId");
CREATE INDEX IF NOT EXISTS "chat_threads_tenantId_status_idx" ON "chat_threads"("tenantId", "status");

CREATE TABLE IF NOT EXISTS "chat_messages" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "authorType" TEXT NOT NULL,
    "authorId" TEXT,
    "authorName" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "clientId" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "chat_messages_threadId_createdAt_idx" ON "chat_messages"("threadId", "createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "chat_messages_threadId_clientId_key" ON "chat_messages"("threadId", "clientId");
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "chat_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "announcements" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "audience" TEXT NOT NULL DEFAULT 'all',
    "status" TEXT NOT NULL DEFAULT 'published',
    "publishAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "announcements_tenantId_status_idx" ON "announcements"("tenantId", "status");

CREATE TABLE IF NOT EXISTS "reviews" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "guestName" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "moderationNote" TEXT,
    "moderatedById" TEXT,
    "moderatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "reviews_reservationId_key" ON "reviews"("reservationId");
CREATE INDEX IF NOT EXISTS "reviews_tenantId_status_idx" ON "reviews"("tenantId", "status");
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO permissions (id, resource, action, description, category)
SELECT gen_random_uuid(), 'announcement', 'manage', 'Compose and publish guest-portal announcements', 'communications'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE resource = 'announcement' AND action = 'manage');

INSERT INTO role_permissions (id, "roleId", "permissionId")
SELECT gen_random_uuid(), r.id, p.id
FROM roles r JOIN permissions p ON p.resource = 'announcement' AND p.action = 'manage'
WHERE r."tenantId" IS NULL AND r.name IN ('Owner','Admin','Manager')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- Demo announcement (so the portal feed has content on first boot)
INSERT INTO "announcements" ("id", "tenantId", "title", "body", "status", "publishAt", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, t.id, 'Welcome to Demo Downtown Hotel',
       'Pool deck renovation wraps up Friday — the rooftop spa remains open throughout. Room service runs 06:30–22:30.',
       'published', now(), now(), now()
FROM tenants t
WHERE t.slug = 'demo-hotel'
  AND NOT EXISTS (SELECT 1 FROM "announcements" a WHERE a."tenantId" = t.id AND a.title = 'Welcome to Demo Downtown Hotel');
