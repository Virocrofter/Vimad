CREATE TABLE "guest_identity_groups" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "label" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "guest_identity_groups_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "guest_identity_members" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "guest_identity_members_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "guest_identity_groups_tenantId_idx" ON "guest_identity_groups"("tenantId");
CREATE INDEX "guest_identity_members_groupId_idx" ON "guest_identity_members"("groupId");
CREATE INDEX "guest_identity_members_guestId_idx" ON "guest_identity_members"("guestId");
CREATE UNIQUE INDEX "guest_identity_members_groupId_guestId_key" ON "guest_identity_members"("groupId", "guestId");
ALTER TABLE "guest_identity_groups" ADD CONSTRAINT "guest_identity_groups_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "guest_identity_members" ADD CONSTRAINT "guest_identity_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "guest_identity_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "guest_identity_members" ADD CONSTRAINT "guest_identity_members_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
