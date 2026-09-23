/*
  Warnings:

  - Added the required column `updatedAt` to the `idempotency_keys` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "idempotency_keys" ADD COLUMN     "requestBody" JSONB,
ADD COLUMN     "requestPath" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
