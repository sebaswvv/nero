"use client";

import { useEffect, useState } from "react";

type IncomeSummary = {
  totalIncomeEur: string;
};

type Props = {
  ledgerId: string;
  from: string;
  to: string;
};

export default function IncomeSummaryCard({ ledgerId, from, to }: Props) {
  const [summary, setSummary] = useState<IncomeSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSummary() {
      if (!ledgerId || !from || !to) {
        setSummary(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ ledgerId, from, to });
        const res = await fetch(`/api/analytics/income-summary?${params.toString()}`, {
          credentials: "include",
        });

        if (!res.ok) {
          let message = "Failed to load income summary";
          try {
            const errData = await res.json();
            message = errData?.message ?? message;
          } catch {
            // ignore
          }
          throw new Error(message);
        }

        const data: IncomeSummary = await res.json();
        setSummary(data);
      } catch (e) {
        setError((e as Error).message);
        setSummary(null);
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, [ledgerId, from, to]);

  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold">Income</div>

      {error && <div className="text-sm text-red-500">{error}</div>}

      {loading ? (
        <div className="text-sm opacity-70">Loading…</div>
      ) : !summary ? (
        <div className="text-sm opacity-70">Select a ledger and date range.</div>
      ) : (
        <div className="p-3 border border-gray-600 rounded">
          <div className="text-xs opacity-70">Total income</div>
          <div className="text-lg font-bold">€ {summary.totalIncomeEur}</div>
        </div>
      )}
    </div>
  );
}
