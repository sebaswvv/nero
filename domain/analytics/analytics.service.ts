import { requireLedgerAccess } from "@/lib/api/ledger-access";
import { Prisma } from "@prisma/client";
import { DateRange, ExpensesSummary, VariableExpensesAggregation } from "./analytics.types";
import {
  getLatestActiveRecurringExpenseAmounts,
  getLatestActiveRecurringIncomeAmounts,
  getTransactionsGroupedByCategory,
} from "./analytics.repository";

export async function getExpensesSummary(
  userId: string,
  ledgerId: string,
  range: DateRange
): Promise<ExpensesSummary> {
  await requireLedgerAccess(userId, ledgerId);

  const variableExpenses = await aggregateVariableExpenses(ledgerId, range);
  const totalRecurringExpensesEur = await sumRecurringExpenses(ledgerId, range);

  const totalExpenses =
    variableExpenses.totalExpensesTransactionsEur.plus(totalRecurringExpensesEur);

  return {
    totalExpensesEur: totalExpenses.toFixed(2),
    totalExpensesTransactionsEur: variableExpenses.totalExpensesTransactionsEur.toFixed(2),
    totalExpenseTransactions: variableExpenses.totalExpenseTransactions,
    perCategoryEur: variableExpenses.perCategoryEur,
    totalRecurringExpensesEur: totalRecurringExpensesEur.toFixed(2),
  };
}

export async function getIncomeSummary(
  userId: string,
  ledgerId: string,
  range: DateRange
): Promise<{ totalIncomeEur: string }> {
  await requireLedgerAccess(userId, ledgerId);

  const totalIncomeEur = await sumRecurringIncome(ledgerId, range);

  return { totalIncomeEur: totalIncomeEur.toFixed(2) };
}

export async function getNetBalanceSummary(
  userId: string,
  ledgerId: string,
  range: DateRange
): Promise<{ netBalanceEur: string }> {
  const expensesSummary = await getExpensesSummary(userId, ledgerId, range);
  const incomeSummary = await getIncomeSummary(userId, ledgerId, range);

  const totalExpensesEur = new Prisma.Decimal(expensesSummary.totalExpensesEur);
  const totalIncomeEur = new Prisma.Decimal(incomeSummary.totalIncomeEur);

  return {
    netBalanceEur: totalIncomeEur.minus(totalExpensesEur).toFixed(2),
  };
}

async function aggregateVariableExpenses(
  ledgerId: string,
  range: DateRange
): Promise<VariableExpensesAggregation> {
  const groupedExpenses = await getTransactionsGroupedByCategory(ledgerId, range);

  const perCategoryEur: Record<string, string> = {};
  let totalExpensesTransactionsEur = new Prisma.Decimal(0);
  let totalExpenseTransactions = 0;

  // sum up the totals from the grouped expenses
  for (const row of groupedExpenses) {
    perCategoryEur[row.category] = row.sumAmountEur.toFixed(2);
    totalExpensesTransactionsEur = totalExpensesTransactionsEur.plus(row.sumAmountEur);
    totalExpenseTransactions += row.count;
  }

  return { perCategoryEur, totalExpensesTransactionsEur, totalExpenseTransactions };
}

async function sumRecurringExpenses(ledgerId: string, range: DateRange): Promise<Prisma.Decimal> {
  const recurringExpenseAmounts = await getLatestActiveRecurringExpenseAmounts(ledgerId, range);

  // sum up the amounts
  let totalRecurringExpensesEur = new Prisma.Decimal(0);
  for (const amount of recurringExpenseAmounts) {
    totalRecurringExpensesEur = totalRecurringExpensesEur.plus(amount);
  }

  return totalRecurringExpensesEur;
}

async function sumRecurringIncome(ledgerId: string, range: DateRange): Promise<Prisma.Decimal> {
  const incomeAmounts = await getLatestActiveRecurringIncomeAmounts(ledgerId, range);

  // sum up the amounts
  let totalIncomeEur = new Prisma.Decimal(0);
  for (const amount of incomeAmounts) {
    totalIncomeEur = totalIncomeEur.plus(amount);
  }

  return totalIncomeEur;
}
