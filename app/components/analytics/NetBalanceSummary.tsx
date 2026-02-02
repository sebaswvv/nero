// app/components/analytics/NetBalanceSummary.tsx
"use client";

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
    <div className="p-3 border border-gray-600 rounded">
      <div className="text-sm opacity-75">Net balance</div>

      <div className={`text-lg font-bold mt-1 ${isPositive ? "text-green-400" : "text-red-400"}`}>
        € {net}
      </div>

      <div className="text-xs opacity-60 mt-1">Income − expenses within the selected period</div>
    </div>
  );
}
