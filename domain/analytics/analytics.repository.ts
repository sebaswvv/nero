import { prisma } from "@/lib/api/db";
import { Prisma } from "@prisma/client";
import { DateRange } from "./analytics.types";

export type GroupedTransactionsByCategoryRow = {
  category: string;
  sumAmountEur: Prisma.Decimal;
  count: number;
};

export async function getTransactionsGroupedByCategory(
  ledgerId: string,
  range: DateRange
): Promise<GroupedTransactionsByCategoryRow[]> {
  const grouped = await prisma.transaction.groupBy({
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

  // map the grouped results to the expected return type
  return grouped.map((g) => ({
    category: g.category,
    sumAmountEur: g._sum.amountEur ?? new Prisma.Decimal(0),
    count: g._count._all,
  }));
}

export async function getLatestActiveRecurringExpenseAmounts(
  ledgerId: string,
  range: DateRange
): Promise<Prisma.Decimal[]> {
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

  // get the amount from the latest version for each recurring item
  return recurringItems
    .map((item) => item.versions[0]?.amountEur)
    .filter((x): x is Prisma.Decimal => Boolean(x));
}

export async function getLatestActiveRecurringIncomeAmounts(
  ledgerId: string,
  range: DateRange
): Promise<Prisma.Decimal[]> {
  const incomeItems = await prisma.recurringItem.findMany({
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

  // get the amountEur from the latest version for each income item
  return incomeItems
    .map((item) => item.versions[0]?.amountEur)
    .filter((x): x is Prisma.Decimal => Boolean(x));
}
