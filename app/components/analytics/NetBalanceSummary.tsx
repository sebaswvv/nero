// app/components/analytics/NetBalanceSummary.tsx
"use client";

import Card from "../ui/Card";

type NetBalanceSummary = {
  netBalanceEur: string;
};

type Props = {
  summary: NetBalanceSummary;
};

export default function NetBalanceSummaryCard({ summary }: Props) {
  const net = summary.netBalanceEur;
  const netNumber = Number(net);
  const isPositive = !Number.isNaN(netNumber) && netNumber >= 0;

  return (
    <Card>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-sm font-medium text-slate-400 mb-1">Net Balance</div>
          <div
            className={`text-3xl font-bold ${isPositive ? "text-emerald-400" : "text-red-400"}`}
          >
            {isPositive ? "+" : ""}€{net}
          </div>
        </div>
        <div className="text-4xl">{isPositive ? "📈" : "📉"}</div>
      </div>
      <div className="text-xs text-slate-500">Income minus expenses for the selected period</div>
    </Card>
  );
}
