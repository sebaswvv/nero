"use client";

import { useEffect, useState } from "react";
import ExpensesSummaryCard from "./analytics/ExpensesSummary";
import IncomeSummaryCard from "./analytics/IncomeSummary";
import NetBalanceSummaryCard from "@/app/components/analytics/NetBalanceSummary";
import { startOfCurrentMonth, endOfCurrentMonth } from "./analytics/dateUtils";
import Card from "./ui/Card";
import Select from "./ui/Select";
import Input from "./ui/Input";
import LoadingSpinner from "./ui/LoadingSpinner";

type Ledger = {
  id: string;
  name: string;
};

type CombinedAnalyticsSummary = {
  expenses: {
    totalExpensesEur: string;
    totalExpensesTransactionsEur: string;
    totalExpenseTransactions: number;
    perCategoryEur: Record<string, string>;
    totalRecurringExpensesEur: string;
  };
  income: {
    totalIncomeEur: string;
  };
  balance: {
    netBalanceEur: string;
  };
};

export default function AnalyticsOverview() {
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [selectedLedger, setSelectedLedger] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>(startOfCurrentMonth());
  const [toDate, setToDate] = useState<string>(endOfCurrentMonth());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [summary, setSummary] = useState<CombinedAnalyticsSummary | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/ledgers", { credentials: "include" });
        if (!res.ok) {
          throw new Error("Failed to load ledgers");
        }
        const data: Ledger[] = await res.json();
        setLedgers(data);
        if (data.length > 0) {
          setSelectedLedger(data[0].id);
        }
      } catch (e) {
        setError((e as Error).message);
      }
    }
    init();
  }, []);

  useEffect(() => {
    async function fetchAnalytics() {
      if (!selectedLedger || !fromDate || !toDate) {
        setSummary(null);
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
        const res = await fetch(`/api/analytics/summary?${params.toString()}`, {
          credentials: "include",
        });

        if (!res.ok) {
          let message = "Failed to load analytics";
          try {
            const errData = await res.json();
            message = errData?.message ?? message;
          } catch {
            // ignore
          }
          throw new Error(message);
        }

        const data: CombinedAnalyticsSummary = await res.json();
        setSummary(data);
      } catch (e) {
        setError((e as Error).message);
        setSummary(null);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [selectedLedger, fromDate, toDate]);

  if (ledgers.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-slate-400">Create a ledger to view analytics</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">Financial Overview</h2>
            <p className="text-sm text-slate-400">
              View your income, expenses, and balance for a selected period
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Ledger"
              value={selectedLedger}
              onChange={(e) => setSelectedLedger(e.target.value)}
              options={ledgers.map((l) => ({ value: l.id, label: l.name }))}
              fullWidth
            />

            <Input
              type="date"
              label="From"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              fullWidth
            />

            <Input
              type="date"
              label="To"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              fullWidth
            />
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>
      </Card>

      {loading ? (
        <Card>
          <LoadingSpinner className="py-12" size="lg" />
        </Card>
      ) : !summary ? null : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <IncomeSummaryCard summary={summary.income} />
          <ExpensesSummaryCard summary={summary.expenses} />
          <NetBalanceSummaryCard summary={summary.balance} />
        </div>
      )}
    </div>
  );
}
