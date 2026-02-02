"use client";

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
  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold">Expenses</div>

      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 border border-gray-600 rounded">
            <div className="text-xs opacity-70">Total expenses</div>
            <div className="text-lg font-bold">€ {summary.totalExpensesEur}</div>
          </div>
          <div className="p-3 border border-gray-600 rounded">
            <div className="text-xs opacity-70">Variable expenses</div>
            <div className="text-lg font-bold">€ {summary.totalExpensesTransactionsEur}</div>
            <div className="text-xs opacity-60">
              {summary.totalExpenseTransactions} transactions
            </div>
          </div>
          <div className="p-3 border border-gray-600 rounded">
            <div className="text-xs opacity-70">Recurring expenses</div>
            <div className="text-lg font-bold">€ {summary.totalRecurringExpensesEur}</div>
          </div>
        </div>

        <div className="border border-gray-600 rounded p-3">
          <div className="text-sm font-semibold">By category</div>

          {Object.keys(summary.perCategoryEur).length === 0 ? (
            <div className="text-sm opacity-70 mt-2">No expenses in this period.</div>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {Object.entries(summary.perCategoryEur)
                .sort((a, b) => Number(b[1]) - Number(a[1]))
                .map(([category, amount]) => (
                  <li key={category} className="flex justify-between gap-4">
                    <span className="capitalize">{category.replace(/_/g, " ")}</span>
                    <span className="font-mono">€ {amount}</span>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
