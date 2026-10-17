-- AlterTable
ALTER TABLE "corporate_accounts" ADD COLUMN     "scClientId" TEXT;

-- CreateIndex
CREATE INDEX "corporate_accounts_tenantId_scClientId_idx" ON "corporate_accounts"("tenantId", "scClientId");

-- AddForeignKey
ALTER TABLE "corporate_accounts" ADD CONSTRAINT "corporate_accounts_scClientId_fkey" FOREIGN KEY ("scClientId") REFERENCES "sc_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
