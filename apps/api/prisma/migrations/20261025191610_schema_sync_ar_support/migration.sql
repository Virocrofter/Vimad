-- DropIndex
-- DROP INDEX IF EXISTS "ar_payments_tenantId_reference_key";

-- RenameForeignKey
-- ALTER TABLE "ar_invoice_items" RENAME CONSTRAINT "ar_invoice_items_invoice_fkey" TO "ar_invoice_items_invoiceId_fkey";

-- RenameForeignKey
-- ALTER TABLE "ar_invoices" RENAME CONSTRAINT "ar_invoices_account_fkey" TO "ar_invoices_corporateAccountId_fkey";

-- RenameForeignKey
-- ALTER TABLE "ar_invoices" RENAME CONSTRAINT "ar_invoices_property_fkey" TO "ar_invoices_propertyId_fkey";

-- RenameForeignKey
-- ALTER TABLE "ar_payments" RENAME CONSTRAINT "ar_payments_account_fkey" TO "ar_payments_corporateAccountId_fkey";

-- RenameForeignKey
-- ALTER TABLE "ar_payments" RENAME CONSTRAINT "ar_payments_invoice_fkey" TO "ar_payments_invoiceId_fkey";

-- RenameIndex
-- ALTER INDEX "ar_invoices_account_status_idx" RENAME TO "ar_invoices_corporateAccountId_status_idx";

-- RenameIndex
-- ALTER INDEX "ar_payments_tenantId_account_idx" RENAME TO "ar_payments_tenantId_corporateAccountId_idx";
