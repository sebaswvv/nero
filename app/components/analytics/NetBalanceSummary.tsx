// app/components/analytics/NetBalanceSummary.tsx
"use client";

import { useEffect, useState } from "react";

type NetBalanceSummary = {
  netBalanceEur: string;
};

type Props = {
  ledgerId: string;
  from: string;
  to: string;
};

export default function NetBalanceSummaryCard({ ledgerId, from, to }: Props) {
  const [data, setData] = useState<NetBalanceSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchNetBalance() {
    if (!ledgerId || !from || !to) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ ledgerId, from, to });
      const res = await fetch(`/api/analytics/balance-summary?${params.toString()}`, {
        credentials: "include",
      });

      if (!res.ok) {
        let message = "Failed to load net balance";
        try {
          const errData = await res.json();
          message = errData?.message ?? message;
        } catch {
          // ignore
        }
        throw new Error(message);
      }

      const json: NetBalanceSummary = await res.json();
      setData(json);
    } catch (e) {
      setError((e as Error).message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNetBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ledgerId, from, to]);

  const net = data?.netBalanceEur ?? "0.00";
  const netNumber = Number(net);
  const isPositive = !Number.isNaN(netNumber) && netNumber >= 0;

  return (
    <div className="p-3 border border-gray-600 rounded">
      <div className="text-sm opacity-75">Net balance</div>

      {loading ? (
        <div className="text-sm opacity-70 mt-1">Loading…</div>
      ) : error ? (
        <div className="text-sm text-red-500 mt-1">{error}</div>
      ) : (
        <div className={`text-lg font-bold mt-1 ${isPositive ? "text-green-400" : "text-red-400"}`}>
          € {net}
        </div>
      )}

      <div className="text-xs opacity-60 mt-1">Income − expenses within the selected period</div>
    </div>
  );
}
