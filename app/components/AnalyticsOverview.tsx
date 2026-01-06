"use client";

import { useEffect, useState } from "react";
import ExpensesSummaryCard from "./analytics/ExpensesSummary";
import IncomeSummaryCard from "./analytics/IncomeSummary";
import { startOfCurrentMonth, endOfCurrentMonth } from "./analytics/dateUtils";

type Ledger = {
  id: string;
  name: string;
};

export default function AnalyticsOverview() {
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [selectedLedger, setSelectedLedger] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>(startOfCurrentMonth());
  const [toDate, setToDate] = useState<string>(endOfCurrentMonth());
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xl font-semibold">Analytics</div>
          <div className="text-sm opacity-70">Income and expenses for a selected period.</div>
        </div>

        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs mb-1 opacity-70">Ledger</label>
            <select
              value={selectedLedger}
              onChange={(e) => setSelectedLedger(e.target.value)}
              className="px-2 py-1 rounded border border-gray-600 bg-transparent text-sm"
            >
              {ledgers.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs mb-1 opacity-70">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-2 py-1 rounded border border-gray-600 bg-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-xs mb-1 opacity-70">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-2 py-1 rounded border border-gray-600 bg-transparent text-sm"
            />
          </div>
        </div>
      </div>

      {error && <div className="text-sm text-red-500">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <IncomeSummaryCard ledgerId={selectedLedger} from={fromDate} to={toDate} />
        <ExpensesSummaryCard ledgerId={selectedLedger} from={fromDate} to={toDate} />
      </div>
    </div>
  );
}
