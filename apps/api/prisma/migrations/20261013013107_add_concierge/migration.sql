-- DropForeignKey
ALTER TABLE "minibar_checks" DROP CONSTRAINT "minibar_checks_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "minibar_checks" DROP CONSTRAINT "minibar_checks_tenantId_fkey";

-- DropIndex
DROP INDEX "concierge_items_folioItemId_idx";
