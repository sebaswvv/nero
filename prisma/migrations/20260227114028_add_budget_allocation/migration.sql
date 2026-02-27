-- CreateTable
CREATE TABLE "BudgetAllocation" (
    "id" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "yearMonth" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "budgetAmountEur" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BudgetAllocation_ledgerId_yearMonth_idx" ON "BudgetAllocation"("ledgerId", "yearMonth");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetAllocation_userId_ledgerId_yearMonth_category_key" ON "BudgetAllocation"("userId", "ledgerId", "yearMonth", "category");

-- CreateIndex
CREATE INDEX "RecurringItemVersion_validFrom_validTo_idx" ON "RecurringItemVersion"("validFrom", "validTo");

-- AddForeignKey
ALTER TABLE "BudgetAllocation" ADD CONSTRAINT "BudgetAllocation_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "Ledger"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetAllocation" ADD CONSTRAINT "BudgetAllocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
