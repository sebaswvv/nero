"use client";

import { useEffect, useMemo, useState } from "react";

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

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toDateInputValueUTC(d: Date) {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

function startOfCurrentMonthUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
}

function endOfCurrentMonthUTC(): Date {
  const now = new Date();
  // last day of month at 00:00 UTC (date-only semantics). We’ll send it as date-only.
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 0, 0, 0, 0));
}

export default function TransactionsPage() {
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [selectedLedger, setSelectedLedger] = useState<string | null>(null);

  // NEW: date range
  const [rangeFrom, setRangeFrom] = useState(() => toDateInputValueUTC(startOfCurrentMonthUTC()));
  const [rangeTo, setRangeTo] = useState(() => toDateInputValueUTC(endOfCurrentMonthUTC()));

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // form state for creating a transaction
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

  const styles = useMemo(() => {
    return {
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
        flexWrap: "wrap",
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
  }, []);

  function formatAmount(cents: number) {
    return (cents / 100).toFixed(2);
  }

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

    // basic FE guard so you don't spam the API with invalid range
    if (rangeFrom && rangeTo && rangeFrom > rangeTo) {
      setError("Invalid range: from must be before to");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("ledgerId", ledgerId);

      // NEW: pass range
      if (rangeFrom) params.set("from", rangeFrom);
      if (rangeTo) params.set("to", rangeTo);

      const res = await fetch(`/api/transactions?${params.toString()}`);
      if (!res.ok) throw new Error(`Failed to load transactions (${res.status})`);
      setTransactions(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLedgers();
  }, []);

  useEffect(() => {
    if (selectedLedger) loadTransactions(selectedLedger);
    // reload on range change
  }, [selectedLedger, rangeFrom, rangeTo]);

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
          occurredAt: txOccurredAt, // YYYY-MM-DD
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

  return (
    <main style={styles.main}>
      <header style={styles.headerCard}>
        <div>
          <h2 style={{ margin: 0 }}>Transactions</h2>
          <p style={{ margin: 0, opacity: 0.7, fontSize: 13 }}>
            View and create transactions for a ledger using a date range.
          </p>
        </div>
      </header>

      {error && (
        <div
          style={{
            ...styles.card,
            borderColor: "rgba(255,80,80,0.25)",
            background: "rgba(255,50,50,0.04)",
          }}
        >
          {error}
        </div>
      )}

      <section style={styles.card}>
        {/* Create transaction form */}
        <div style={{ display: "grid", gap: 12, marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Create transaction</h3>
          {txError && <div style={{ color: "tomato", padding: 8, borderRadius: 8 }}>{txError}</div>}

          <div style={styles.formGrid}>
            <input
              placeholder="Merchant (optional)"
              value={txMerchant}
              onChange={(e) => setTxMerchant(e.target.value)}
              style={styles.input}
            />
            <input
              type="date"
              value={txOccurredAt}
              onChange={(e) => setTxOccurredAt(e.target.value)}
              style={{ ...styles.input, padding: "6px 10px" }}
            />
            <input
              placeholder="Description (optional)"
              value={txDescription}
              onChange={(e) => setTxDescription(e.target.value)}
              style={{ ...styles.input, gridColumn: "1 / -1" }}
            />
            <input
              placeholder="Amount (cents)"
              value={txAmount}
              onChange={(e) =>
                setTxAmount(e.target.value === "" ? "" : parseInt(e.target.value, 10))
              }
              style={styles.input}
            />
            <select
              value={txCategory}
              onChange={(e) => setTxCategory(e.target.value as any)}
              style={styles.select}
            >
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
            <select
              value={txDirection}
              onChange={(e) => setTxDirection(e.target.value as any)}
              style={styles.select}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={createTransaction}
              disabled={creatingTx || !selectedLedger}
              style={styles.buttonPrimary}
            >
              {creatingTx ? "Creating..." : "Add transaction"}
            </button>
            <div style={{ flex: 1 }} />
            <button
              onClick={() => {
                setTxAmount("");
                setTxMerchant("");
                setTxDescription("");
                setTxError(null);
              }}
              style={styles.buttonGhost}
            >
              Reset
            </button>
          </div>
        </div>

        {/* controls */}
        <div style={styles.controlBar}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 13, opacity: 0.8 }}>Ledger</span>
            <select
              value={selectedLedger ?? ""}
              onChange={(e) => setSelectedLedger(e.target.value)}
              style={{ ...styles.select, ...styles.ledgerSelect }}
            >
              <option value="">Select ledger</option>
              {ledgers.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 13, opacity: 0.8 }}>From</span>
            <input
              type="date"
              value={rangeFrom}
              onChange={(e) => setRangeFrom(e.target.value)}
              style={{ ...styles.input, padding: "6px 10px" }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 13, opacity: 0.8 }}>To</span>
            <input
              type="date"
              value={rangeTo}
              onChange={(e) => setRangeTo(e.target.value)}
              style={{ ...styles.input, padding: "6px 10px" }}
            />
          </label>

          <div style={{ flex: 1 }} />

          <button
            onClick={() => loadTransactions()}
            disabled={!selectedLedger}
            style={styles.buttonPrimary}
          >
            Refresh
          </button>

          <button
            onClick={() => {
              setRangeFrom(toDateInputValueUTC(startOfCurrentMonthUTC()));
              setRangeTo(toDateInputValueUTC(endOfCurrentMonthUTC()));
            }}
            style={styles.buttonGhost}
          >
            This month
          </button>
        </div>

        {/* transactions list */}
        <div>
          {loading ? (
            <div style={styles.muted}>Loading…</div>
          ) : transactions.length === 0 ? (
            <div style={styles.muted}>No transactions for selected range.</div>
          ) : (
            <div style={styles.txList}>
              {transactions.map((t) => (
                <li key={t.id} style={styles.txItem}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={styles.badge}>{t.category}</span>
                    <div>
                      <strong>{t.direction}</strong>
                      <div style={{ ...styles.muted }}>
                        {new Date(t.occurredAt).toISOString().slice(0, 10)}{" "}
                        {t.merchant ? `• ${t.merchant}` : ""}
                      </div>
                      {t.description && (
                        <div style={{ fontSize: 13, opacity: 0.9 }}>{t.description}</div>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={
                        t.direction === "income" ? styles.amountPositive : styles.amountNegative
                      }
                    >
                      {formatAmount(t.amountCents)}
                    </div>
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
