-- DropForeignKey
ALTER TABLE "ticket_counters" DROP CONSTRAINT "ticket_counters_tenantId_fkey";

-- DropIndex
DROP INDEX "tickets_propertyId_idx";
