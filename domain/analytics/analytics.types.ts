import { Prisma } from "@prisma/client";

export type DateRange = { from: Date; to: Date };

export type ExpensesSummary = {
  totalExpensesEur: string;
  totalExpensesTransactionsEur: string;
  totalExpenseTransactions: number;
  perCategoryEur: Record<string, string>;
  totalRecurringExpensesEur: string;
};

export type VariableExpensesAggregation = {
  perCategoryEur: Record<string, string>;
  totalExpensesTransactionsEur: Prisma.Decimal;
  totalExpenseTransactions: number;
};
