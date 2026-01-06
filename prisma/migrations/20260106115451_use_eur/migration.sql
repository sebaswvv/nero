/*
  Warnings:

  - You are about to drop the column `amountCents` on the `RecurringItemVersion` table. All the data in the column will be lost.
  - You are about to drop the column `amountCents` on the `Transaction` table. All the data in the column will be lost.
  - Added the required column `amountEur` to the `RecurringItemVersion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `amountEur` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RecurringItemVersion" DROP COLUMN "amountCents",
ADD COLUMN     "amountEur" DECIMAL(12,2) NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "amountCents",
ADD COLUMN     "amountEur" DECIMAL(12,2) NOT NULL;
