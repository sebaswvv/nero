import { prisma } from "@/lib/api/db";
import { requireLedgerAccess } from "@/lib/api/ledger-access";
import { Prisma } from "@prisma/client";

type DateRange = { from: Date; to: Date };

type ExpensesSummary = {
  totalExpensesEur: string;
  totalExpensesTransactionsEur: string;
  totalExpenseTransactions: number;
  perCategoryEur: Record<string, string>;
  totalRecurringExpensesEur: string;
};

export async function getExpensesSummary(
  userId: string,
  ledgerId: string,
  range: DateRange
): Promise<ExpensesSummary> {
  await requireLedgerAccess(userId, ledgerId);

  // 1) Variable expenses (transactions) grouped by category
  const groupedExpenses = await prisma.transaction.groupBy({
    by: ["category"],
    where: {
      ledgerId,
      direction: "expense",
      occurredAt: {
        gte: range.from,
        lte: range.to,
      },
    },
    _sum: { amountEur: true },
    _count: { _all: true },
  });

  const perCategoryEur: Record<string, string> = {};
  let totalExpensesTransactionsEur = new Prisma.Decimal(0);
  let totalExpenseTransactions = 0;

  // sum up per-category amounts and counts
  for (const group of groupedExpenses) {
    const category = group.category;

    const categorySum = group._sum.amountEur ?? new Prisma.Decimal(0);
    const categoryCount = group._count._all;

    perCategoryEur[category] = categorySum.toFixed(2);

    totalExpensesTransactionsEur = totalExpensesTransactionsEur.plus(categorySum);
    totalExpenseTransactions += categoryCount;
  }

  // 2) recurring expenses, pick latest active version within date range
  const recurringItems = await prisma.recurringItem.findMany({
    where: {
      ledgerId,
      direction: "expense",
      isActive: true,
    },
    select: {
      versions: {
        where: {
          AND: [
            { validFrom: { lte: range.to } },
            { OR: [{ validTo: null }, { validTo: { gte: range.from } }] },
          ],
        },
        orderBy: { validFrom: "desc" },
        select: { amountEur: true },
        take: 1,
      },
    },
  });

  let totalRecurringExpensesEur = new Prisma.Decimal(0);

  // sum up the amounts of the latest active versions
  for (const item of recurringItems) {
    const latestActiveVersion = item.versions[0];
    if (!latestActiveVersion) continue;

    totalRecurringExpensesEur = totalRecurringExpensesEur.plus(latestActiveVersion.amountEur);
  }

  // total expenses = variable + recurring
  const totalExpensesEur = totalExpensesTransactionsEur.plus(totalRecurringExpensesEur);

  return {
    totalExpensesEur: totalExpensesEur.toFixed(2),
    totalExpensesTransactionsEur: totalExpensesTransactionsEur.toFixed(2),
    totalExpenseTransactions,
    perCategoryEur,
    totalRecurringExpensesEur: totalRecurringExpensesEur.toFixed(2),
  };
}

export async function getIncomeSummary(
  userId: string,
  ledgerId: string,
  range: DateRange
): Promise<{ totalIncomeEur: string }> {
  await requireLedgerAccess(userId, ledgerId);

  // get all income items from the ledger, within the date range
  const income = await prisma.recurringItem.findMany({
    where: {
      ledgerId,
      direction: "income",
      isActive: true,
    },
    select: {
      versions: {
        where: {
          AND: [
            { validFrom: { lte: range.to } },
            { OR: [{ validTo: null }, { validTo: { gte: range.from } }] },
          ],
        },
        orderBy: { validFrom: "desc" },
        select: { amountEur: true },
        take: 1,
      },
    },
  });

  let totalIncomeEur = new Prisma.Decimal(0);

  // sum up the amounts of the latest active versions
  for (const item of income) {
    const latestActiveVersion = item.versions[0];
    if (!latestActiveVersion) continue;

    totalIncomeEur = totalIncomeEur.plus(latestActiveVersion.amountEur);
  }

  return {
    totalIncomeEur: totalIncomeEur.toFixed(2),
  };
}

// make a function to get the sum of expenses - income within a date range
export async function getNetBalanceSummary(
  userId: string,
  ledgerId: string,
  range: DateRange
): Promise<{ netBalanceEur: string }> {
  const expensesSummary = await getExpensesSummary(userId, ledgerId, range);
  const incomeSummary = await getIncomeSummary(userId, ledgerId, range);

  const totalExpensesEur = new Prisma.Decimal(expensesSummary.totalExpensesEur);
  const totalIncomeEur = new Prisma.Decimal(incomeSummary.totalIncomeEur);

  const netBalanceEur = totalIncomeEur.minus(totalExpensesEur);

  return {
    netBalanceEur: netBalanceEur.toFixed(2),
  };
}
