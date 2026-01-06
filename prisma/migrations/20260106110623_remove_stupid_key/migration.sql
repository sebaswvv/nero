/*
  Warnings:

  - You are about to drop the column `idempotencyKey` on the `Transaction` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Transaction_ledgerId_idempotencyKey_key";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "idempotencyKey";
