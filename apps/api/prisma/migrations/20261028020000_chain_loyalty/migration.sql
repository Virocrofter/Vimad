ALTER TABLE "loyalty_transactions" ADD COLUMN IF NOT EXISTS "propertyId" TEXT;
CREATE INDEX IF NOT EXISTS "loyalty_transactions_propertyId_idx" ON "loyalty_transactions"("propertyId");
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "loyalty_configs" (
    "tenantId" TEXT NOT NULL,
    "chainId" TEXT,
    "earnRate" DECIMAL(10,4) NOT NULL DEFAULT 1.0,
    "redeemValue" DECIMAL(10,4) NOT NULL DEFAULT 0.10,
    "tiers" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "loyalty_configs_pkey" PRIMARY KEY ("tenantId")
);
ALTER TABLE "loyalty_configs" ADD CONSTRAINT "loyalty_configs_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO permissions (id, resource, action, description, category)
SELECT gen_random_uuid(), v.resource, v.action, v.description, 'loyalty'
FROM (VALUES
  ('loyalty_chain','view','View chain-wide loyalty board and guest chain history'),
  ('loyalty_chain','manage','Configure chain loyalty and post earn/redeem at any property')
) AS v(resource, action, description)
ON CONFLICT (resource, action) DO NOTHING;

INSERT INTO role_permissions (id, "roleId", "permissionId")
SELECT gen_random_uuid(), r.id, p.id
FROM roles r JOIN permissions p ON p.resource = 'loyalty_chain'
WHERE r."tenantId" IS NULL AND r.name IN ('Owner','Admin','Manager')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

INSERT INTO role_permissions (id, "roleId", "permissionId")
SELECT gen_random_uuid(), r.id, p.id
FROM roles r JOIN permissions p ON p.resource = 'loyalty_chain' AND p.action = 'view'
WHERE r."tenantId" IS NULL AND r.name IN ('Staff','Housekeeper')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
