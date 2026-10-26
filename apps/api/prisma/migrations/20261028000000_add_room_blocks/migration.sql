CREATE TABLE IF NOT EXISTS "room_blocks" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "roomId" TEXT,
    "roomTypeId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'ooo',
    "status" TEXT NOT NULL DEFAULT 'active',
    "reason" TEXT,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "room_blocks_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "room_blocks_tenantId_propertyId_startDate_endDate_idx" ON "room_blocks"("tenantId", "propertyId", "startDate", "endDate");
CREATE INDEX IF NOT EXISTS "room_blocks_roomId_startDate_endDate_idx" ON "room_blocks"("roomId", "startDate", "endDate");
CREATE INDEX IF NOT EXISTS "room_blocks_roomTypeId_startDate_endDate_idx" ON "room_blocks"("roomTypeId", "startDate", "endDate");
INSERT INTO permissions (id, resource, action, description, category)
SELECT gen_random_uuid(), 'room_block', 'manage', 'Create/return dated OOO, OOS and hold blocks on the room plan', 'inventory'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE resource = 'room_block' AND action = 'manage');
INSERT INTO role_permissions (id, "roleId", "permissionId")
SELECT gen_random_uuid(), r.id, p.id
FROM roles r JOIN permissions p ON p.resource = 'room_block' AND p.action = 'manage'
WHERE r."tenantId" IS NULL AND r.name IN ('Owner','Admin','Manager')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
