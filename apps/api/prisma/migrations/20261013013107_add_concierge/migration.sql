-- DropForeignKey
ALTER TABLE "minibar_checks" DROP CONSTRAINT "minibar_checks_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "minibar_checks" DROP CONSTRAINT "minibar_checks_tenantId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "concierge_items_folioItemId_idx";
