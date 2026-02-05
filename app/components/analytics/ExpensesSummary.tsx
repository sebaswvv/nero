"use client";

import Card from "../ui/Card";

export type ExpensesSummary = {
  totalExpensesEur: string;
  totalExpensesTransactionsEur: string;
  totalExpenseTransactions: number;
  perCategoryEur: Record<string, string>;
  totalRecurringExpensesEur: string;
};

type Props = {
  summary: ExpensesSummary;
};

export default function ExpensesSummaryCard({ summary }: Props) {
  const topCategories = Object.entries(summary.perCategoryEur)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, 5);

  return (
    <Card>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-sm font-medium text-slate-400 mb-1">Total Expenses</div>
          <div className="text-3xl font-bold text-red-400">€{summary.totalExpensesEur}</div>
        </div>
        <div className="text-4xl">💸</div>
      </div>

      <div className="space-y-3 mt-4 pt-4 border-t border-slate-800">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Variable</span>
          <span className="text-white font-medium">€{summary.totalExpensesTransactionsEur}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Recurring</span>
          <span className="text-white font-medium">€{summary.totalRecurringExpensesEur}</span>
        </div>
      </div>

      {topCategories.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-800">
          <div className="text-xs font-medium text-slate-400 mb-2">Top Categories</div>
          <div className="space-y-2">
            {topCategories.map(([category, amount]) => (
              <div key={category} className="flex items-center justify-between text-sm">
                <span className="text-slate-300 capitalize">{category.replace(/_/g, " ")}</span>
                <span className="text-white font-mono">€{amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
