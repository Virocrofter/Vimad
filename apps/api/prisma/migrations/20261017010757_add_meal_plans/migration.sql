/*
  Warnings:

  - You are about to drop the column `createdAt` on the `meal_plans` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `meal_plans` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "meal_plans" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";
