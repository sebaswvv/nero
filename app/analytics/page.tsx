"use client";

import { useEffect, useState } from "react";

type Ledger = {
  id: string;
  name: string;
};

type ExpensesSummary = {
  totalExpensesCents: number;
  totalExpensesTransactionsCents: number;
  totalExpenseTransactions: number;
  totalRecurringExpensesCents: number;
  perCategory: Record<string, number>;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toDateInputValueUTC(d: Date) {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

function startOfCurrentMonthUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function endOfCurrentMonthUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
}

export default function AnalyticsPage() {
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [selectedLedger, setSelectedLedger] = useState<string | null>(null);

  const [from, setFrom] = useState(() => toDateInputValueUTC(startOfCurrentMonthUTC()));
  const [to, setTo] = useState(() => toDateInputValueUTC(endOfCurrentMonthUTC()));

  const [summary, setSummary] = useState<ExpensesSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadLedgers() {
    try {
      const res = await fetch("/api/ledgers");
      if (!res.ok) throw new Error("Failed to load ledgers");
      const data = await res.json();
      setLedgers(data);
      if (data.length && !selectedLedger) {
        setSelectedLedger(data[0].id);
      }
    } catch (e) {
      setError("Failed to load ledgers");
    }
  }

  async function loadSummary() {
    if (!selectedLedger) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        ledgerId: selectedLedger,
        from,
        to,
      });

      const res = await fetch(`/api/analytics/expenses-summary?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load analytics");

      setSummary(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLedgers();
  }, []);

  useEffect(() => {
    if (selectedLedger) {
      loadSummary();
    }
  }, [selectedLedger, from, to]);

  function formatAmount(cents: number) {
    return (cents / 100).toFixed(2);
  }

  return (
    <main
      style={{
        padding: 24,
        maxWidth: 980,
        margin: "0 auto",
        display: "grid",
        gap: 16,
      }}
    >
      <header>
        <h2 style={{ margin: 0 }}>Analytics</h2>
        <p style={{ margin: 0, opacity: 0.75 }}>Overview of expenses for a selected period.</p>
      </header>

      {error && (
        <div
          style={{
            padding: 12,
            borderRadius: 10,
            background: "rgba(255,0,0,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          {error}
        </div>
      )}

      <section
        style={{
          padding: 16,
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.12)",
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <select value={selectedLedger ?? ""} onChange={(e) => setSelectedLedger(e.target.value)}>
          <option value="">Select ledger</option>
          {ledgers.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>

        <label>
          From <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>

        <label>
          To <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>

        <button onClick={loadSummary} disabled={!selectedLedger}>
          Refresh
        </button>

        <button
          onClick={() => {
            setFrom(toDateInputValueUTC(startOfCurrentMonthUTC()));
            setTo(toDateInputValueUTC(endOfCurrentMonthUTC()));
          }}
        >
          This month
        </button>
      </section>

      {loading ? (
        <div style={{ opacity: 0.75 }}>Loading…</div>
      ) : !summary ? (
        <div style={{ opacity: 0.75 }}>No data.</div>
      ) : (
        <section
          style={{
            padding: 16,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.12)",
            display: "grid",
            gap: 16,
          }}
        >
          <div>
            <strong>Total expenses</strong>
            <div>{formatAmount(summary.totalExpensesCents)}</div>
          </div>

          <div>
            <strong>Fixed expenses</strong>
            <div>{formatAmount(summary.totalRecurringExpensesCents)}</div>
          </div>

          <div>
            <strong>Variable expenses</strong>
            <div>{formatAmount(summary.totalExpensesTransactionsCents)}</div>
            <div style={{ opacity: 0.7, fontSize: 13 }}>
              {summary.totalExpenseTransactions} transactions
            </div>
          </div>

          <div>
            <strong>Variable expenses by category</strong>
            <ul style={{ paddingLeft: 16 }}>
              {Object.entries(summary.perCategory).map(([category, cents]) => (
                <li key={category}>
                  {category}: {formatAmount(cents)}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </main>
  );
}
