import { prisma } from "@/lib/db";
import { requireLedgerAccess } from "@/lib/ledger-access";

export async function getExpensesSummary(
  userId: string,
  ledgerId: string,
  range: { from: Date; to: Date }
) {
  await requireLedgerAccess(userId, ledgerId);

  // variable expenses (transactions)
  const transactions = await prisma.transaction.findMany({
    where: {
      ledgerId: ledgerId,
      direction: "expense",
      occurredAt: {
        gte: range.from,
        lte: range.to,
      },
    },
    select: {
      amountCents: true,
      category: true,
    },
  });

  let totalExpensesTransactionsCents = 0;
  let totalExpenseTransactions = 0;

  const perCategory: Record<string, number> = {};

  for (const transaction of transactions) {
    // total amount
    totalExpensesTransactionsCents = totalExpensesTransactionsCents + transaction.amountCents;

    // count transactions
    totalExpenseTransactions = totalExpenseTransactions + 1;

    // per category
    const category = transaction.category;

    if (perCategory[category] === undefined) {
      perCategory[category] = 0;
    }

    perCategory[category] = perCategory[category] + transaction.amountCents;
  }

  // fixed expenses (recurring items)
  const recurringItems = await prisma.recurringItem.findMany({
    where: {
      ledgerId: ledgerId,
      direction: "expense",
      isActive: true,
      frequency: "monthly",
    },
    include: {
      versions: {
        orderBy: { validFrom: "desc" },
        select: {
          amountCents: true,
          validFrom: true,
          validTo: true,
        },
      },
    },
  });

  let totalRecurringExpensesCents = 0;

  // calculate total recurring expenses within the date range
  for (const item of recurringItems) {
    let hasActiveVersion = false;
    let activeAmountCents = 0;

    // find the version that is active within the date range
    for (const version of item.versions) {
      const startsBeforeRangeEnd = version.validFrom <= range.to;
      const endsAfterRangeStart = version.validTo === null || version.validTo >= range.from;

      if (startsBeforeRangeEnd && endsAfterRangeStart) {
        hasActiveVersion = true;
        activeAmountCents = version.amountCents;
        break;
      }
    }

    if (hasActiveVersion) {
      totalRecurringExpensesCents = totalRecurringExpensesCents + activeAmountCents;
    }
  }


  // totals
  const totalExpensesCents = totalExpensesTransactionsCents + totalRecurringExpensesCents;
  return {
    totalExpensesCents,
    totalExpensesTransactionsCents,
    totalExpenseTransactions,
    perCategory,
    totalRecurringExpensesCents,
  };
}
