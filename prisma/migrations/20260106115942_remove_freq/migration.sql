/*
  Warnings:

  - You are about to drop the column `frequency` on the `RecurringItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "RecurringItem" DROP COLUMN "frequency";

-- DropEnum
DROP TYPE "Frequency";
