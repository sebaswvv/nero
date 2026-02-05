"use client";

import Card from "../ui/Card";

type IncomeSummary = {
  totalIncomeEur: string;
};

type Props = {
  summary: IncomeSummary;
};

export default function IncomeSummaryCard({ summary }: Props) {
  return (
    <Card>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-sm font-medium text-slate-400 mb-1">Total Income</div>
          <div className="text-3xl font-bold text-emerald-400">€{summary.totalIncomeEur}</div>
        </div>
        <div className="text-4xl">💰</div>
      </div>
      <div className="text-xs text-slate-500">Revenue for selected period</div>
    </Card>
  );
}
