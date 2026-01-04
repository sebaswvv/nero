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

  // new form state for creating a transaction
  const [txAmount, setTxAmount] = useState<number | "">("");
  const [txCategory, setTxCategory] = useState<
    | "groceries"
    | "eating_out"
    | "going_out"
    | "transport"
    | "clothing"
    | "health_and_fitness"
    | "other"
    | "gifts"
    | "incidental_income"
    >("other");
  const [txDirection, setTxDirection] = useState<"expense" | "income">("expense");
  const [txMerchant, setTxMerchant] = useState("");
  const [txDescription, setTxDescription] = useState("");
  const [txOccurredAt, setTxOccurredAt] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  });
  const [creatingTx, setCreatingTx] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

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

  async function createTransaction() {
    if (!selectedLedger) {
      setTxError("Select a ledger");
      return;
    }
    if (typeof txAmount !== "number" || !Number.isInteger(txAmount) || txAmount <= 0) {
      setTxError("Amount must be a positive integer (cents)");
      return;
    }
    if (!txCategory) {
      setTxError("Category is required");
      return;
    }

    setCreatingTx(true);
    setTxError(null);
    try {
      const idempotencyKey =
        (typeof crypto !== "undefined" && (crypto as any).randomUUID
          ? (crypto as any).randomUUID()
          : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`);

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ledgerId: selectedLedger,
          amountCents: txAmount,
          category: txCategory,
          direction: txDirection,
          merchant: txMerchant || undefined,
          description: txDescription || undefined,
          occurredAt: txOccurredAt, // YYYY-MM-DD is acceptable
          idempotencyKey,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.message ?? `Failed to create transaction (${res.status})`);
      }

      // reset form and refresh list
      setTxAmount("");
      setTxMerchant("");
      setTxDescription("");
      setTxOccurredAt(new Date().toISOString().slice(0, 10));
      await loadTransactions(selectedLedger);
    } catch (e) {
      setTxError(e instanceof Error ? e.message : "Failed to create transaction");
    } finally {
      setCreatingTx(false);
    }
  }

  // new: centralized styles and small helper
  const styles = {
    main: {
      padding: 24,
      maxWidth: 980,
      margin: "0 auto",
      display: "grid",
      gap: 16,
      color: "#E6EEF3",
      fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial",
    } as React.CSSProperties,
    card: {
      padding: 18,
      borderRadius: 12,
      border: "1px solid rgba(255,255,255,0.06)",
      background: "linear-gradient(180deg, rgba(255,255,255,0.012), rgba(255,255,255,0.006))",
    } as React.CSSProperties,
    headerCard: {
      padding: 16,
      borderRadius: 12,
      border: "1px solid rgba(255,255,255,0.04)",
      background: "rgba(255,255,255,0.01)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    } as React.CSSProperties,
    formGrid: {
      display: "grid",
      gap: 10,
      gridTemplateColumns: "1fr 180px",
    } as React.CSSProperties,
    input: {
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.06)",
      color: "#E6EEF3",
      padding: "8px 10px",
      borderRadius: 8,
    } as React.CSSProperties,
    select: {
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.06)",
      color: "#E6EEF3",
      padding: "8px 10px",
      borderRadius: 8,
    } as React.CSSProperties,
    buttonPrimary: {
      padding: "8px 12px",
      borderRadius: 8,
      border: "1px solid rgba(255,255,255,0.12)",
      background: "rgba(255,255,255,0.05)",
      color: "white",
      cursor: "pointer",
    } as React.CSSProperties,
    buttonGhost: {
      padding: "8px 12px",
      borderRadius: 8,
      border: "1px solid rgba(255,255,255,0.04)",
      background: "transparent",
      color: "rgba(230,238,243,0.9)",
      cursor: "pointer",
    } as React.CSSProperties,
    controlBar: {
      display: "flex",
      gap: 12,
      alignItems: "center",
      marginBottom: 12,
    } as React.CSSProperties,
    ledgerSelect: {
      minWidth: 220,
    } as React.CSSProperties,
    txList: {
      display: "grid",
      gap: 12,
      marginTop: 8,
    } as React.CSSProperties,
    txItem: {
      padding: 12,
      borderRadius: 10,
      border: "1px solid rgba(255,255,255,0.06)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: "rgba(255,255,255,0.01)",
    } as React.CSSProperties,
    badge: {
      fontSize: 12,
      padding: "4px 8px",
      borderRadius: 999,
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.04)",
      color: "rgba(230,238,243,0.95)",
      marginRight: 8,
    } as React.CSSProperties,
    amountPositive: { color: "#6EE7B7", fontWeight: 600 } as React.CSSProperties,
    amountNegative: { color: "#FFB4AA", fontWeight: 600 } as React.CSSProperties,
    muted: { opacity: 0.75, fontSize: 13 } as React.CSSProperties,
  };

  function formatAmount(cents: number) {
    return (cents / 100).toFixed(2);
  }

  return (
    <main style={styles.main}>
      {/* header */}
      <header style={styles.headerCard}>
        <div>
          <h2 style={{ margin: 0 }}>Transactions</h2>
          <p style={{ margin: 0, opacity: 0.7, fontSize: 13 }}>View and create transactions for a ledger — monthly or yearly.</p>
        </div>
      </header>

      {error && <div style={{ ...styles.card, borderColor: "rgba(255,80,80,0.25)", background: "rgba(255,50,50,0.04)" }}>{error}</div>}

      <section style={styles.card}>
        {/* Create transaction form */}
        <div style={{ display: "grid", gap: 12, marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Create transaction</h3>
          {txError && <div style={{ color: "tomato", padding: 8, borderRadius: 8 }}>{txError}</div>}

          <div style={styles.formGrid}>
            <input placeholder="Merchant (optional)" value={txMerchant} onChange={(e) => setTxMerchant(e.target.value)} style={styles.input} />
            <input type="date" value={txOccurredAt} onChange={(e) => setTxOccurredAt(e.target.value)} style={{ ...styles.input, padding: "6px 10px" }} />
            <input placeholder="Description (optional)" value={txDescription} onChange={(e) => setTxDescription(e.target.value)} style={{ ...styles.input, gridColumn: "1 / -1" }} />
            <input placeholder="Amount (cents)" value={txAmount} onChange={(e) => setTxAmount(e.target.value === "" ? "" : parseInt(e.target.value, 10))} style={styles.input} />
            <select value={txCategory} onChange={(e) => setTxCategory(e.target.value as any)} style={styles.select}>
              <option value="groceries">Groceries</option>
              <option value="eating_out">Eating out</option>
              <option value="going_out">Going out</option>
              <option value="transport">Transport</option>
              <option value="clothing">Clothing</option>
              <option value="health_and_fitness">Health & fitness</option>
              <option value="gifts">Gifts</option>
              <option value="incidental_income">Incidental income</option>
              <option value="other">Other</option>
            </select>
            <select value={txDirection} onChange={(e) => setTxDirection(e.target.value as any)} style={styles.select}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={createTransaction} disabled={creatingTx || !selectedLedger} style={styles.buttonPrimary}>
              {creatingTx ? "Creating..." : "Add transaction"}
            </button>
            <div style={{ flex: 1 }} />
            <button onClick={() => { setTxAmount(""); setTxMerchant(""); setTxDescription(""); setTxError(null); }} style={styles.buttonGhost}>
              Reset
            </button>
          </div>
        </div>

        {/* controls */}
        <div style={styles.controlBar}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 13, opacity: 0.8 }}>Ledger</span>
            <select value={selectedLedger ?? ""} onChange={(e) => setSelectedLedger(e.target.value)} style={{ ...styles.select, ...styles.ledgerSelect }}>
              <option value="">Select ledger</option>
              {ledgers.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </label>

          <div style={{ flex: 1 }} />

          <button onClick={() => loadTransactions()} disabled={!selectedLedger} style={styles.buttonPrimary}>
            Refresh
          </button>
        </div>

        {/* period controls */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
          <button onClick={() => setPeriod("monthly")} style={{ ...styles.buttonGhost, border: period === "monthly" ? "1px solid rgba(255,255,255,0.12)" : styles.buttonGhost.border, background: period === "monthly" ? "rgba(255,255,255,0.03)" : "transparent" }}>Monthly</button>
          <button onClick={() => setPeriod("yearly")} style={{ ...styles.buttonGhost, border: period === "yearly" ? "1px solid rgba(255,255,255,0.12)" : styles.buttonGhost.border, background: period === "yearly" ? "rgba(255,255,255,0.03)" : "transparent" }}>Yearly</button>

          <div style={{ flex: 1 }} />

          {period === "monthly" ? (
            <input type="month" value={date} onChange={(e) => setDate(e.target.value)} style={styles.input} />
          ) : (
            <input type="number" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...styles.input, width: 120 }} />
          )}
        </div>

        {/* transactions list */}
        <div>
          {loading ? (
            <div style={styles.muted}>Loading…</div>
          ) : transactions.length === 0 ? (
            <div style={styles.muted}>No transactions for selected range.</div>
          ) : (
            <div style={styles.txList}>
              {transactions.map(t => (
                <li key={t.id} style={styles.txItem}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={styles.badge}>{t.category}</span>
                    <div>
                      <strong>{t.direction}</strong>
                      <div style={{ ...styles.muted }}>{new Date(t.occurredAt).toISOString().slice(0,10)} {t.merchant ? `• ${t.merchant}` : ""}</div>
                      {t.description && <div style={{ fontSize: 13, opacity: 0.9 }}>{t.description}</div>}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={t.direction === "income" ? styles.amountPositive : styles.amountNegative}>{formatAmount(t.amountCents)}</div>
                  </div>
                </li>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
