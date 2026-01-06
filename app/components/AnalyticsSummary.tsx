// 'use client' directive ensures this component runs on the client side
'use client';

import { useState, useEffect } from "react";

type Ledger = {
  id: string;
  name: string;
  type: string;
};

type ExpensesSummary = {
  totalExpensesEur: string;
  totalExpensesTransactionsEur: string;
  totalExpenseTransactions: number;
  perCategoryEur: Record<string, string>;
  totalRecurringExpensesEur: string;
};

/**
 * AnalyticsSummary fetches and displays an expenses summary for a selected ledger
 * and date range.  It also allows the user to switch between ledgers and change
 * the date range.  Data is fetched from the backend API at `/api/analytics/expenses-summary`.
 *
 * The component defaults the date range to the start and end of the current month.
 */
export default function AnalyticsSummary() {
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [selectedLedger, setSelectedLedger] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [summary, setSummary] = useState<ExpensesSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /** Fetch the list of ledgers and set the initial date range on mount. */
  useEffect(() => {
    async function init() {
      try {
        // fetch ledgers the user has access to
        const res = await fetch("/api/ledgers", { credentials: "include" });
        if (!res.ok) {
          throw new Error("Failed to load ledgers");
        }
        const data: Ledger[] = await res.json();
        setLedgers(data);
        if (data.length > 0) {
          // pick the first ledger as the default selected ledger
          setSelectedLedger(data[0].id);
        }
        // set default date range to the current month
        const now = new Date();
        const first = new Date(now.getFullYear(), now.getMonth(), 1);
        const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        function toDateInputValue(date: Date) {
          const y = date.getFullYear();
          const m = String(date.getMonth() + 1).padStart(2, "0");
          const d = String(date.getDate()).padStart(2, "0");
          return `${y}-${m}-${d}`;
        } 

        setFromDate(toDateInputValue(first));
        setToDate(toDateInputValue(last));

      } catch (err) {
        console.error(err);
        setError((err as Error).message);
      }
    }
    init();
  }, []);

  /** Fetch summary data based on the selected ledger and date range. */
  async function fetchSummary() {
    if (!selectedLedger || !fromDate || !toDate) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        ledgerId: selectedLedger,
        from: fromDate,
        to: toDate,
      });
      const res = await fetch(`/api/analytics/expenses-summary?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) {
        // attempt to parse error message if available
        let message = "Failed to load analytics";
        try {
          const errData = await res.json();
          message = errData?.message ?? message;
        } catch {
          // ignore JSON parse errors
        }
        throw new Error(message);
      }
      const data: ExpensesSummary = await res.json();
      setSummary(data);
    } catch (err) {
      console.error(err);
      setError((err as Error).message);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }

  // fetch summary whenever inputs change
  useEffect(() => {
    if (selectedLedger && fromDate && toDate) {
      fetchSummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLedger, fromDate, toDate]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Analytics</h2>
      {error && <div className="text-red-500">{error}</div>}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-sm mb-1">Ledger</label>
          <select
            value={selectedLedger}
            onChange={(e) => setSelectedLedger(e.target.value)}
            className="px-2 py-1 rounded border border-gray-600 bg-transparent text-sm"
          >
            {ledgers.map((ledger) => (
              <option key={ledger.id} value={ledger.id}>
                {ledger.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-2 py-1 rounded border border-gray-600 bg-transparent text-sm"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-2 py-1 rounded border border-gray-600 bg-transparent text-sm"
          />
        </div>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : summary ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 border border-gray-600 rounded">
              <div className="text-sm opacity-75">Total expenses</div>
              <div className="text-lg font-bold">€ {summary.totalExpensesEur}</div>
            </div>
            <div className="p-3 border border-gray-600 rounded">
              <div className="text-sm opacity-75">Variable expenses</div>
              <div className="text-lg font-bold">€ {summary.totalExpensesTransactionsEur}</div>
              <div className="text-xs opacity-60">
                {summary.totalExpenseTransactions} transactions
              </div>
            </div>
            <div className="p-3 border border-gray-600 rounded">
              <div className="text-sm opacity-75">Recurring expenses</div>
              <div className="text-lg font-bold">€ {summary.totalRecurringExpensesEur}</div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mt-4">Expenses by category</h3>
            {Object.keys(summary.perCategoryEur).length === 0 ? (
              <div className="text-sm opacity-70">No expenses in this period</div>
            ) : (
              <ul className="list-disc list-inside space-y-1 mt-2">
                {Object.entries(summary.perCategoryEur).map(([category, amount]) => (
                  <li key={category}>
                    {category.replace(/_/g, " ")}: € {amount}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <div className="text-sm opacity-70">
          Select a ledger and date range to view analytics.
        </div>
      )}
    </div>
  );
}