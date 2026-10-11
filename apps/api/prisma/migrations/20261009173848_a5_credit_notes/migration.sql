-- AlterTable
ALTER TABLE "tax_invoices" ADD COLUMN     "originalId" TEXT,
ADD COLUMN     "originalNumber" TEXT,
ADD COLUMN     "reason" TEXT;

-- AddForeignKey
ALTER TABLE "tax_invoices" ADD CONSTRAINT "tax_invoices_originalId_fkey" FOREIGN KEY ("originalId") REFERENCES "tax_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
