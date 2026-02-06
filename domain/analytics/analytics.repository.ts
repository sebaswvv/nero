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
  // use raw SQL with DISTINCT ON to efficiently get the latest version for each recurring item
  // this avoids the N+1 problem of fetching versions separately for each item
  const result = await prisma.$queryRaw<Array<{ amountEur: Prisma.Decimal }>>`
    SELECT DISTINCT ON (ri.id) v."amountEur"
    FROM "RecurringItem" ri
    INNER JOIN "RecurringItemVersion" v ON v."recurringItemId" = ri.id
    WHERE ri."ledgerId" = ${ledgerId}
      AND ri.direction = 'expense'
      AND ri."isActive" = true
      AND v."validFrom" <= ${range.to}
      AND (v."validTo" IS NULL OR v."validTo" >= ${range.from})
    ORDER BY ri.id, v."validFrom" DESC
  `;

  return result.map((row) => row.amountEur);
}

export async function getLatestActiveRecurringIncomeAmounts(
  ledgerId: string,
  range: DateRange
): Promise<Prisma.Decimal[]> {
  // use raw SQL with DISTINCT ON to efficiently get the latest version for each recurring item
  // this avoids the N+1 problem of fetching versions separately for each item
  const result = await prisma.$queryRaw<Array<{ amountEur: Prisma.Decimal }>>`
    SELECT DISTINCT ON (ri.id) v."amountEur"
    FROM "RecurringItem" ri
    INNER JOIN "RecurringItemVersion" v ON v."recurringItemId" = ri.id
    WHERE ri."ledgerId" = ${ledgerId}
      AND ri.direction = 'income'
      AND ri."isActive" = true
      AND v."validFrom" <= ${range.to}
      AND (v."validTo" IS NULL OR v."validTo" >= ${range.from})
    ORDER BY ri.id, v."validFrom" DESC
  `;

  return result.map((row) => row.amountEur);
}

export type MonthlyTransactionsByCategoryRow = {
  category: string;
  year: number;
  month: number;
  sumAmountEur: Prisma.Decimal;
  count: number;
};

export async function getVariableExpensesGroupedByCategoryAndMonth(
  ledgerId: string,
  range: DateRange
): Promise<MonthlyTransactionsByCategoryRow[]> {
  // use raw SQL for efficient grouping by category and month
  // extract year and month from occurredAt for grouping
  const result = await prisma.$queryRaw<
    Array<{
      category: string;
      year: number;
      month: number;
      sumAmountEur: Prisma.Decimal;
      count: bigint;
    }>
  >`
    SELECT 
      category,
      EXTRACT(YEAR FROM "occurredAt")::integer as year,
      EXTRACT(MONTH FROM "occurredAt")::integer as month,
      SUM("amountEur") as "sumAmountEur",
      COUNT(*)::bigint as count
    FROM "Transaction"
    WHERE "ledgerId" = ${ledgerId}
      AND direction = 'expense'
      AND "occurredAt" >= ${range.from}
      AND "occurredAt" <= ${range.to}
    GROUP BY category, year, month
    ORDER BY category, year, month
  `;

  return result.map((row) => ({
    category: row.category,
    year: row.year,
    month: row.month,
    sumAmountEur: row.sumAmountEur,
    count: Number(row.count),
  }));
}
