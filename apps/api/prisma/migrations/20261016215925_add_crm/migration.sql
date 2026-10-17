/*
  Warnings:

  - Added the required column `tenantId` to the `guest_notes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "guest_notes" ADD COLUMN     "pinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tenantId" TEXT;

-- Backfill: existing notes inherit their tenant from the guest they belong to
UPDATE "guest_notes" AS gn
SET "tenantId" = g."tenantId"
FROM "guests" AS g
WHERE gn."guestId" = g."id";

-- Enforce NOT NULL only after every row has a tenant
ALTER TABLE "guest_notes" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "guests" ADD COLUMN     "corporateAccountId" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "corporate_accounts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "negotiatedRate" DECIMAL(10,2),
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "corporate_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_follow_ups" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "assigneeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "doneAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guest_follow_ups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_segments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "rule" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "memberCount" INTEGER NOT NULL DEFAULT 0,
    "lastRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guest_segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_segment_memberships" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guest_segment_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "corporate_accounts_tenantId_name_idx" ON "corporate_accounts"("tenantId", "name");

-- CreateIndex
CREATE INDEX "guest_follow_ups_tenantId_assigneeId_doneAt_idx" ON "guest_follow_ups"("tenantId", "assigneeId", "doneAt");

-- CreateIndex
CREATE INDEX "guest_segments_tenantId_isActive_idx" ON "guest_segments"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "guest_segment_memberships_tenantId_guestId_idx" ON "guest_segment_memberships"("tenantId", "guestId");

-- CreateIndex
CREATE UNIQUE INDEX "guest_segment_memberships_segmentId_guestId_key" ON "guest_segment_memberships"("segmentId", "guestId");

-- CreateIndex
CREATE INDEX "guest_notes_tenantId_guestId_createdAt_idx" ON "guest_notes"("tenantId", "guestId", "createdAt");

-- AddForeignKey
ALTER TABLE "guests" ADD CONSTRAINT "guests_corporateAccountId_fkey" FOREIGN KEY ("corporateAccountId") REFERENCES "corporate_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corporate_accounts" ADD CONSTRAINT "corporate_accounts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_follow_ups" ADD CONSTRAINT "guest_follow_ups_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_follow_ups" ADD CONSTRAINT "guest_follow_ups_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_segments" ADD CONSTRAINT "guest_segments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_segment_memberships" ADD CONSTRAINT "guest_segment_memberships_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_segment_memberships" ADD CONSTRAINT "guest_segment_memberships_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "guest_segments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_segment_memberships" ADD CONSTRAINT "guest_segment_memberships_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
