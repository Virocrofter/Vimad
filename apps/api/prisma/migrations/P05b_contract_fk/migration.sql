ALTER TABLE "contracts" DROP CONSTRAINT IF EXISTS "contracts_tenantId_fkey";
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
