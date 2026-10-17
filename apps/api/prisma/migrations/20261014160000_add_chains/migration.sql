-- C1: Chain model + property switcher
CREATE TABLE "chains" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "chains_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "chains_tenantId_slug_key" ON "chains"("tenantId", "slug");
CREATE INDEX "chains_tenantId_idx" ON "chains"("tenantId");

ALTER TABLE "chains" ADD CONSTRAINT "chains_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "properties" ADD COLUMN "chainId" TEXT;
ALTER TABLE "properties" ADD CONSTRAINT "properties_chainId_fkey"
  FOREIGN KEY ("chainId") REFERENCES "chains"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "properties_chainId_idx" ON "properties"("chainId");

-- C1: sticky property-switcher choice per user
ALTER TABLE "users" ADD COLUMN "lastPropertyId" TEXT;