-- AR: Accounts Receivable — corporate ledger, invoices, payments, dunning

ALTER TABLE "corporate_accounts"
  ADD COLUMN "creditLimit" DECIMAL(12,2),
  ADD COLUMN "paymentTermsDays" INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN "taxNumber" TEXT,
  ADD COLUMN "billingContact" TEXT,
  ADD COLUMN "billingEmail" TEXT,
  ADD COLUMN "billingAddress" TEXT;

CREATE TABLE "ar_invoices" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "corporateAccountId" TEXT NOT NULL,
    "propertyId" TEXT,
    "number" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "currency" TEXT NOT NULL DEFAULT 'ZAR',
    "subtotal" DECIMAL(12,2) NOT NULL,
    "vatRate" DECIMAL(5,2) NOT NULL DEFAULT 15.00,
    "vatAmount" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "amountPaid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATE NOT NULL,
    "sentAt" TIMESTAMP(3),
    "lastReminderAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ar_invoices_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ar_invoice_items" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "folioId" TEXT,
    "reservationId" TEXT,
    "guestId" TEXT,
    "date" DATE NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "vatRate" DECIMAL(5,2) NOT NULL DEFAULT 15.00,
    CONSTRAINT "ar_invoice_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ar_payments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "corporateAccountId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ZAR',
    "method" TEXT NOT NULL DEFAULT 'bank_transfer',
    "reference" TEXT,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'applied',
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedById" TEXT,
    "reversedAt" TIMESTAMP(3),
    "reversalReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ar_payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ar_invoice_counters" (
    "tenantId" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ar_invoice_counters_pkey" PRIMARY KEY ("tenantId")
);

CREATE UNIQUE INDEX "ar_invoices_tenantId_number_key" ON "ar_invoices" ("tenantId", "number");
CREATE INDEX "ar_invoices_tenantId_status_idx" ON "ar_invoices" ("tenantId", "status");
CREATE INDEX "ar_invoices_corporateAccountId_status_idx" ON "ar_invoices" ("corporateAccountId", "status");
CREATE INDEX "ar_invoices_tenantId_dueDate_idx" ON "ar_invoices" ("tenantId", "dueDate");
CREATE INDEX "ar_invoice_items_invoiceId_idx" ON "ar_invoice_items" ("invoiceId");
CREATE INDEX "ar_payments_tenantId_corporateAccountId_idx" ON "ar_payments" ("tenantId", "corporateAccountId");
CREATE INDEX "ar_payments_tenantId_receivedAt_idx" ON "ar_payments" ("tenantId", "receivedAt");

ALTER TABLE "ar_invoices" ADD CONSTRAINT "ar_invoices_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ar_invoices" ADD CONSTRAINT "ar_invoices_corporateAccountId_fkey"
  FOREIGN KEY ("corporateAccountId") REFERENCES "corporate_accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ar_invoices" ADD CONSTRAINT "ar_invoices_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "properties" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ar_invoice_items" ADD CONSTRAINT "ar_invoice_items_invoiceId_fkey"
  FOREIGN KEY ("invoiceId") REFERENCES "ar_invoices" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ar_payments" ADD CONSTRAINT "ar_payments_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ar_payments" ADD CONSTRAINT "ar_payments_corporateAccountId_fkey"
  FOREIGN KEY ("corporateAccountId") REFERENCES "corporate_accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ar_payments" ADD CONSTRAINT "ar_payments_invoiceId_fkey"
  FOREIGN KEY ("invoiceId") REFERENCES "ar_invoices" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ar_invoice_counters" ADD CONSTRAINT "ar_invoice_counters_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Permissions (resource: ar)
INSERT INTO permissions (id, resource, action, description, category)
SELECT gen_random_uuid(), v.resource, v.action, v.description, 'billing'
FROM (VALUES
  ('ar','read','View AR accounts, invoices, payments, aging'),
  ('ar','manage','Create/edit AR invoices, record payments, manage accounts')
) AS v(resource, action, description)
ON CONFLICT (resource, action) DO NOTHING;

INSERT INTO role_permissions (id, "roleId", "permissionId")
SELECT gen_random_uuid(), r.id, p.id
FROM roles r JOIN permissions p ON p.resource = 'ar'
WHERE r."tenantId" IS NULL AND r.name IN ('Owner','Admin','Manager')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

INSERT INTO role_permissions (id, "roleId", "permissionId")
SELECT gen_random_uuid(), r.id, p.id
FROM roles r JOIN permissions p ON p.resource = 'ar' AND p.action = 'read'
WHERE r."tenantId" IS NULL AND r.name IN ('Staff')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;