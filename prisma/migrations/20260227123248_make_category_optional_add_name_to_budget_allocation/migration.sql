/*
  Warnings:

  - A unique constraint covering the columns `[ledgerId,yearMonth,category]` on the table `BudgetAllocation` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[ledgerId,yearMonth,name]` on the table `BudgetAllocation` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "BudgetAllocation_userId_ledgerId_yearMonth_category_key";

-- AlterTable
ALTER TABLE "BudgetAllocation" ADD COLUMN     "name" TEXT,
ALTER COLUMN "category" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "BudgetAllocation_ledgerId_yearMonth_category_key" ON "BudgetAllocation"("ledgerId", "yearMonth", "category");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetAllocation_ledgerId_yearMonth_name_key" ON "BudgetAllocation"("ledgerId", "yearMonth", "name");
