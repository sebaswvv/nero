"use client";

import { useEffect, useState } from "react";
import Navigation from "../components/Navigation";
import Card from "../components/ui/Card";
import Select from "../components/ui/Select";
import Input from "../components/ui/Input";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { endOfCurrentMonth } from "../components/analytics/dateUtils";
import Badge from "../components/ui/Badge";

type Ledger = {
  id: string;
  name: string;
};

type CategoryAverage = {
  category: string;
  averageMonthlyEur: string;
  totalMonths: number;
  totalAmountEur: string;
};

type MonthlyAveragesSummary = {
  averagePerCategoryEur: CategoryAverage[];
  totalAverageMonthlyEur: string;
  totalMonths: number;
  dateRangeFrom: string;
  dateRangeTo: string;
};

const categoryLabels: Record<string, string> = {
  groceries: "🛒 Groceries",
  eating_out: "🍽️ Eating Out",
  going_out: "🎉 Going Out",
  transport: "🚗 Transport",
  clothing: "👕 Clothing",
  health_and_fitness: "💪 Health & Fitness",
  gifts: "🎁 Gifts",
  other: "📦 Other",
  incidental_income: "💰 Incidental Income",
};

function getOneYearAgo(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 1);
  return date.toISOString().split("T")[0];
}

export default function MonthlyAveragesPage() {
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [selectedLedger, setSelectedLedger] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>(getOneYearAgo());
  const [toDate, setToDate] = useState<string>(endOfCurrentMonth());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [summary, setSummary] = useState<MonthlyAveragesSummary | null>(null);

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
    async function fetchAverages() {
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
        const res = await fetch(`/api/analytics/monthly-averages?${params.toString()}`, {
          credentials: "include",
        });

        if (!res.ok) {
          let message = "Failed to load monthly averages";
          try {
            const errData = await res.json();
            message = errData?.message ?? message;
          } catch {
            // ignore
          }
          throw new Error(message);
        }

        const data: MonthlyAveragesSummary = await res.json();
        setSummary(data);
      } catch (e) {
        setError((e as Error).message);
        setSummary(null);
      } finally {
        setLoading(false);
      }
    }

    fetchAverages();
  }, [selectedLedger, fromDate, toDate]);

  // Calculate max value for chart scaling
  const maxAverage = summary && summary.averagePerCategoryEur.length > 0
    ? Math.max(...summary.averagePerCategoryEur.map((c) => Number(c.averageMonthlyEur)))
    : 0;

  if (ledgers.length === 0) {
    return (
      <>
        <Navigation />
        <div className="lg:ml-64 min-h-screen">
          <div className="p-6 max-w-7xl mx-auto">
            <Card>
              <div className="text-center py-8">
                <p className="text-slate-400">Create a ledger to view monthly averages</p>
              </div>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="lg:ml-64 min-h-screen">
        <div className="p-6 max-w-7xl mx-auto space-y-6">
        <Card>
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">
                Monthly Average Expenses (Variable)
              </h2>
              <p className="text-sm text-slate-400">
                View average monthly spending per category for variable transactions only
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
          <>
            {/* Total Average Card */}
            <Card>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-400 mb-1">
                    Average Monthly Total
                  </div>
                  <div className="text-4xl font-bold text-emerald-400">
                    €{summary.totalAverageMonthlyEur}
                  </div>
                  <div className="mt-2 text-sm text-slate-500">
                    Based on {summary.totalMonths} month{summary.totalMonths !== 1 ? "s" : ""} of
                    data
                  </div>
                </div>
                <div className="text-5xl">📊</div>
              </div>
            </Card>

            {/* Category Breakdown */}
            {summary.averagePerCategoryEur.length > 0 ? (
              <Card>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-white">Average by Category</h3>
                  <p className="text-sm text-slate-400">
                    Monthly spending breakdown per category
                  </p>
                </div>

                <div className="space-y-3">
                  {summary.averagePerCategoryEur.map((cat) => (
                    <div
                      key={cat.category}
                      className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-medium">
                            {categoryLabels[cat.category] || cat.category}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          Total: €{cat.totalAmountEur} across {cat.totalMonths} month
                          {cat.totalMonths !== 1 ? "s" : ""}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-emerald-400">
                          €{cat.averageMonthlyEur}
                        </div>
                        <div className="text-xs text-slate-500">per month</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ) : (
              <Card>
                <div className="text-center py-8">
                  <p className="text-slate-400">No expense data found for the selected period</p>
                </div>
              </Card>
            )}

            {/* Visual Chart */}
            {summary.averagePerCategoryEur.length > 0 && (
              <Card>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white">Visual Breakdown</h3>
                  <p className="text-sm text-slate-400">
                    Bar chart of average monthly spending by category
                  </p>
                </div>

                <div className="space-y-4">
                  {summary.averagePerCategoryEur.map((cat) => {
                    const percentage = maxAverage > 0 ? (Number(cat.averageMonthlyEur) / maxAverage) * 100 : 0;
                    return (
                      <div key={cat.category} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-300 font-medium">
                            {categoryLabels[cat.category] || cat.category}
                          </span>
                          <span className="text-emerald-400 font-semibold">
                            €{cat.averageMonthlyEur}
                          </span>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-8 overflow-hidden border border-slate-800">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full flex items-center justify-end pr-3 transition-all duration-500 ease-out"
                            style={{ width: `${percentage}%` }}
                          >
                            {percentage > 15 && (
                              <span className="text-xs font-semibold text-white">
                                {percentage.toFixed(0)}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
      </div>
    </>
  );
}
