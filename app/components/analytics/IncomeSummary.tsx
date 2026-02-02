"use client";

type IncomeSummary = {
  totalIncomeEur: string;
};

type Props = {
  summary: IncomeSummary;
};

export default function IncomeSummaryCard({ summary }: Props) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold">Income</div>

      <div className="p-3 border border-gray-600 rounded">
        <div className="text-xs opacity-70">Total income</div>
        <div className="text-lg font-bold">€ {summary.totalIncomeEur}</div>
      </div>
    </div>
  );
}
