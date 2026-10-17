-- G1: Groups & room blocks
CREATE TABLE "groups" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "blockType" TEXT NOT NULL DEFAULT 'courtesy',
    "status" TEXT NOT NULL DEFAULT 'prospect',
    "arrivalDate" DATE NOT NULL,
    "departureDate" DATE NOT NULL,
    "cutOffDate" DATE,
    "rate" DECIMAL(10,2),
    "eventSpace" TEXT,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "group_room_blocks" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "roomTypeId" TEXT NOT NULL,
    "roomsBlocked" INTEGER NOT NULL,
    "rate" DECIMAL(10,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_room_blocks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "group_charges" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'misc',
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_charges_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "group_payments" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'bank_transfer',
    "amount" DECIMAL(10,2) NOT NULL,
    "reference" TEXT,
    "note" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "group_events" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "venue" TEXT,
    "date" DATE NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "guests" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'tentative',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "groups_tenantId_code_key" ON "groups"("tenantId", "code");
CREATE INDEX "groups_tenantId_idx" ON "groups"("tenantId");
CREATE INDEX "groups_tenantId_propertyId_status_idx" ON "groups"("tenantId", "propertyId", "status");
CREATE INDEX "groups_tenantId_arrivalDate_idx" ON "groups"("tenantId", "arrivalDate");
CREATE INDEX "group_room_blocks_groupId_idx" ON "group_room_blocks"("groupId");
CREATE INDEX "group_charges_groupId_idx" ON "group_charges"("groupId");
CREATE INDEX "group_payments_groupId_idx" ON "group_payments"("groupId");
CREATE INDEX "group_events_groupId_idx" ON "group_events"("groupId");

ALTER TABLE "reservations" ADD COLUMN "groupId" TEXT,
  ADD COLUMN "roomTypeId" TEXT;

ALTER TABLE "groups" ADD CONSTRAINT "groups_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "groups" ADD CONSTRAINT "groups_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "group_room_blocks" ADD CONSTRAINT "group_room_blocks_groupId_fkey"
  FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "group_room_blocks" ADD CONSTRAINT "group_room_blocks_roomTypeId_fkey"
  FOREIGN KEY ("roomTypeId") REFERENCES "room_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "group_charges" ADD CONSTRAINT "group_charges_groupId_fkey"
  FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "group_payments" ADD CONSTRAINT "group_payments_groupId_fkey"
  FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "group_events" ADD CONSTRAINT "group_events_groupId_fkey"
  FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_groupId_fkey"
  FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_roomTypeId_fkey"
  FOREIGN KEY ("roomTypeId") REFERENCES "room_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "reservations_groupId_idx" ON "reservations"("groupId");