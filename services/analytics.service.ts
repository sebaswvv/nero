import { prisma } from "@/lib/db";
import { requireLedgerAccess } from "@/lib/ledger-access";

export async function getExpensesSummary(
  userId: string,
  ledgerId: string,
  range: { from: Date; to: Date }
) {
  await requireLedgerAccess(userId, ledgerId);

  // get variable expenses grouped by category
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
    _sum: { amountCents: true },
    _count: { _all: true },
  });

  const perCategory: Record<string, number> = {};
  let totalExpensesTransactionsCents = 0;
  let totalExpenseTransactions = 0;

  for (const group of groupedExpenses) {
    const category = group.category;
    const amount = group._sum?.amountCents ?? 0;
    const count = group._count?._all ?? 0;

    perCategory[category] = amount;
    totalExpensesTransactionsCents = totalExpensesTransactionsCents + amount;
    totalExpenseTransactions = totalExpenseTransactions + count;
  }

  // get active recurring expenses within the date range
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
            {
              validFrom: { lte: range.to },
            },
            {
              OR: [{ validTo: null }, { validTo: { gte: range.from } }],
            },
          ],
        },
        orderBy: { validFrom: "desc" },
        select: { amountCents: true },
        take: 1,
      },
    },
  });

  // sum up the amounts from the latest active versions of recurring items
  let totalRecurringExpensesCents = 0;
  for (const item of recurringItems) {
    if (item.versions.length > 0) {
      totalRecurringExpensesCents += item.versions[0].amountCents;
    }
  }

  // calculate total expenses
  const totalExpensesCents = totalExpensesTransactionsCents + totalRecurringExpensesCents;

  return {
    totalExpensesCents,
    totalExpensesTransactionsCents,
    totalExpenseTransactions,
    perCategory,
    totalRecurringExpensesCents,
  };
}
