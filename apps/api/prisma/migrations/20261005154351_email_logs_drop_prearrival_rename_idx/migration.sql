/*
  Warnings:

  - You are about to drop the column `preArrivalSentAt` on the `reservations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "reservations" DROP COLUMN "preArrivalSentAt";

-- RenameIndex
ALTER INDEX "email_logs_related_idx" RENAME TO "email_logs_relatedType_relatedId_idx";
