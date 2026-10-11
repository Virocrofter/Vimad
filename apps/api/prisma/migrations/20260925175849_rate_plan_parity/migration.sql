-- AlterTable
ALTER TABLE "rate_plans" ADD COLUMN     "advanceDays" INTEGER,
ADD COLUMN     "calculationMethod" TEXT NOT NULL DEFAULT 'fixed',
ADD COLUMN     "calculationValue" DECIMAL(10,2),
ADD COLUMN     "description" TEXT;
