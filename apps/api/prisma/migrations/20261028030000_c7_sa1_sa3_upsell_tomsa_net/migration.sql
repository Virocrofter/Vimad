ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "tomsaLevyEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "tomsaLevyPct" DECIMAL(5,2) NOT NULL DEFAULT 1.0;
ALTER TABLE "rate_plans" ADD COLUMN IF NOT EXISTS "commissionPct" DECIMAL(5,2);
CREATE TABLE IF NOT EXISTS "upsell_products" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'extra',
    "price" DECIMAL(10,2) NOT NULL,
    "taxInclusive" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "upsell_products_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "upsell_products_propertyId_idx" ON "upsell_products"("propertyId");
CREATE TABLE IF NOT EXISTS "upsell_sales" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "folioItemId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "soldById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "upsell_sales_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "upsell_sales_propertyId_createdAt_idx" ON "upsell_sales"("propertyId", "createdAt");
CREATE INDEX IF NOT EXISTS "upsell_sales_reservationId_idx" ON "upsell_sales"("reservationId");
CREATE TABLE IF NOT EXISTS "tomsa_levy_postings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "folioId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "roomCharges" DECIMAL(10,2) NOT NULL,
    "levyPct" DECIMAL(5,2) NOT NULL,
    "levyAmount" DECIMAL(10,2) NOT NULL,
    "folioItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tomsa_levy_postings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "tomsa_levy_postings_folioId_date_key" ON "tomsa_levy_postings"("folioId", "date");
CREATE INDEX IF NOT EXISTS "tomsa_levy_postings_tenantId_date_idx" ON "tomsa_levy_postings"("tenantId", "date");
