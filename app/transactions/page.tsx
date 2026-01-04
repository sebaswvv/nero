"use client";

import { useEffect, useState } from "react";

type Ledger = { id: string; name: string };
type Transaction = {
  id: string;
  amountCents: number;
  direction: "expense" | "income";
  category: string;
  description?: string | null;
  merchant?: string | null;
  occurredAt: string;
};

export default function TransactionsPage() {
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [selectedLedger, setSelectedLedger] = useState<string | null>(null);
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");
  const [date, setDate] = useState(() => {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`; // YYYY-MM default
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadLedgers() {
    try {
      const res = await fetch("/api/ledgers");
      if (!res.ok) throw new Error(`Failed to load ledgers (${res.status})`);
      const data = await res.json();
      setLedgers(data);
      if (data.length && !selectedLedger) setSelectedLedger(data[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load ledgers");
    }
  }

  async function loadTransactions(lid?: string) {
    const ledgerId = lid ?? selectedLedger;
    if (!ledgerId) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("ledgerId", ledgerId);
      params.set("period", period);
      params.set("date", date);
      const res = await fetch(`/api/transactions?${params.toString()}`);
      if (!res.ok) throw new Error(`Failed to load transactions (${res.status})`);
      setTransactions(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadLedgers(); }, []);
  useEffect(() => { if (selectedLedger) loadTransactions(selectedLedger); }, [selectedLedger, period, date]);

  const total = transactions.reduce((s, t) => s + (t.direction === "expense" ? -t.amountCents : t.amountCents), 0);

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto", display: "grid", gap: 16 }}>
      <header style={{ display: "grid", gap: 6 }}>
        <h2 style={{ margin: 0 }}>Transactions</h2>
        <p style={{ margin: 0, opacity: 0.75 }}>View transactions for a ledger (monthly or yearly).</p>
      </header>

      {error && <div style={{ padding: 12, borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,0,0,0.06)" }}>{error}</div>}

      <section style={{ padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 13, opacity: 0.8 }}>Ledger</span>
            <select value={selectedLedger ?? ""} onChange={(e) => setSelectedLedger(e.target.value)}>
              <option value="">Select ledger</option>
              {ledgers.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </label>

          <div style={{ flex: 1 }} />

          <button onClick={() => loadTransactions()} disabled={!selectedLedger} style={{ padding: "8px 12px" }}>
            Refresh
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
          <button onClick={() => setPeriod("monthly")} style={{ padding: "6px 10px", borderRadius: 8, border: period === "monthly" ? "1px solid rgba(255,255,255,0.18)" : "1px solid transparent", background: period === "monthly" ? "rgba(255,255,255,0.04)" : "transparent" }}>Monthly</button>
          <button onClick={() => setPeriod("yearly")} style={{ padding: "6px 10px", borderRadius: 8, border: period === "yearly" ? "1px solid rgba(255,255,255,0.18)" : "1px solid transparent", background: period === "yearly" ? "rgba(255,255,255,0.04)" : "transparent" }}>Yearly</button>

          <div style={{ flex: 1 }} />

          {period === "monthly" ? (
            <input type="month" value={date} onChange={(e) => setDate(e.target.value)} />
          ) : (
            <input type="number" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: 100 }} />
          )}
        </div>

        <div>
          {loading ? (
            <div style={{ opacity: 0.75 }}>Loading…</div>
          ) : transactions.length === 0 ? (
            <div style={{ opacity: 0.75 }}>No transactions for selected range.</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ opacity: 0.9 }}>Total: {(total / 100).toFixed(2)}</div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
                {transactions.map(t => (
                  <li key={t.id} style={{ padding: 10, borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ display: "grid" }}>
                      <strong>{t.category} • {t.direction}</strong>
                      <span style={{ opacity: 0.8, fontSize: 13 }}>{new Date(t.occurredAt).toISOString().slice(0,10)} {t.merchant ? `• ${t.merchant}` : ""}</span>
                      {t.description && <span style={{ fontSize: 13, opacity: 0.85 }}>{t.description}</span>}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 14 }}>{(t.amountCents / 100).toFixed(2)}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
