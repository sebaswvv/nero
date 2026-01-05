"use client";

import { useEffect, useState } from "react";

type Ledger = { id: string; name: string };
type RecurringItem = {
  id: string;
  name: string;
  direction: string;
  frequency: string;
  isActive: boolean;
  versions: { id: string; amountCents: number; validFrom: string; validTo?: string | null }[];
};

// new: shared UI styles for dark mode
const uiStyles = {
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
    padding: 16,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.01)",
  } as React.CSSProperties,
  headerCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.04)",
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
    padding: "6px 10px",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.04)",
    background: "transparent",
    color: "rgba(230,238,243,0.9)",
    cursor: "pointer",
  } as React.CSSProperties,
  tabActive: {
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.03)",
  } as React.CSSProperties,
  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "grid",
    gap: 12,
  } as React.CSSProperties,
  item: {
    padding: 12,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.12)",
    display: "grid",
    gap: 8,
    background: "rgba(255,255,255,0.01)",
  } as React.CSSProperties,
  muted: { opacity: 0.8, fontSize: 13 } as React.CSSProperties,
  versionList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "grid",
    gap: 6,
  } as React.CSSProperties,
  addVersionRow: { display: "flex", gap: 8, alignItems: "center" } as React.CSSProperties,
  errorBox: {
    padding: 12,
    borderRadius: 10,
    border: "1px solid rgba(255,80,80,0.25)",
    background: "rgba(255,50,50,0.04)",
  } as React.CSSProperties,
};

export default function RecurringPage() {
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [selectedLedger, setSelectedLedger] = useState<string | null>(null);
  const [items, setItems] = useState<RecurringItem[]>([]);
  const [selectedTab, setSelectedTab] = useState<"expenses" | "income">("expenses");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredItems = items.filter((it) =>
    selectedTab === "expenses" ? it.direction === "expense" : it.direction === "income"
  );

  // form state
  const [name, setName] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [direction, setDirection] = useState<"expense" | "income">("expense");

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

  async function loadItems(ledgerId?: string | null) {
    const lid = ledgerId ?? selectedLedger;
    if (!lid) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/recurring-items?ledgerId=${encodeURIComponent(lid)}`);
      if (!res.ok) throw new Error(`Failed to load recurring items (${res.status})`);
      setItems(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load recurring items");
    } finally {
      setLoading(false);
    }
  }

  async function createItem() {
    if (!selectedLedger) {
      setError("Select a ledger");
      return;
    }
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (typeof amount !== "number" || !Number.isInteger(amount) || amount <= 0) {
      setError("Amount must be a positive integer (cents)");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/recurring-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ledgerId: selectedLedger,
          name: name.trim(),
          amountCents: amount,
          direction,
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.message ?? `Failed to create recurring item (${res.status})`);
      }
      setName("");
      setAmount("");
      await loadItems();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create recurring item");
    } finally {
      setCreating(false);
    }
  }

  async function addVersion(
    itemId: string,
    amountCents: number,
    setSubmitting: (v: boolean) => void,
    setLocalError: (s: string | null) => void
  ) {
    setSubmitting(true);
    setLocalError(null);
    try {
      const res = await fetch(`/api/recurring-items/${itemId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCents }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.message ?? `Failed to add version (${res.status})`);
      }
      await loadItems();
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Failed to add version");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    loadLedgers();
  }, []);

  useEffect(() => {
    if (selectedLedger) loadItems(selectedLedger);
  }, [selectedLedger]);

  return (
    <main style={uiStyles.main}>
      <header style={uiStyles.headerCard}>
        <div>
          <h2 style={{ margin: 0 }}>Recurring items</h2>
          <p style={{ margin: 0, opacity: 0.75 }}>
            Create and manage recurring items and versions.
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          {/* small space for potential summary or actions */}
        </div>
      </header>

      {error && <div style={uiStyles.errorBox}>{error}</div>}

      <section style={uiStyles.card}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 13, opacity: 0.8 }}>Ledger</span>
            <select
              value={selectedLedger ?? ""}
              onChange={(e) => setSelectedLedger(e.target.value)}
              style={uiStyles.select}
            >
              <option value="">Select ledger</option>
              {ledgers.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>

          <div style={{ flex: 1 }} />

          <button
            onClick={() => loadItems()}
            disabled={!selectedLedger}
            style={uiStyles.buttonPrimary}
          >
            Refresh
          </button>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 13, opacity: 0.8 }}>Name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={uiStyles.input}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 13, opacity: 0.8 }}>Amount (cents)</span>
              <input
                type="number"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value === "" ? "" : parseInt(e.target.value, 10))
                }
                style={uiStyles.input}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 13, opacity: 0.8 }}>Direction</span>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as any)}
                style={uiStyles.select}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </label>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={createItem} disabled={creating} style={uiStyles.buttonPrimary}>
                {creating ? "Creating..." : "Create recurring item"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section style={uiStyles.card}>
        <h3 style={{ marginTop: 0, marginBottom: 12 }}>Items</h3>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button
            onClick={() => setSelectedTab("expenses")}
            style={{
              ...(uiStyles.buttonGhost as any),
              ...(selectedTab === "expenses" ? uiStyles.tabActive : {}),
            }}
          >
            Expenses
          </button>
          <button
            onClick={() => setSelectedTab("income")}
            style={{
              ...(uiStyles.buttonGhost as any),
              ...(selectedTab === "income" ? uiStyles.tabActive : {}),
            }}
          >
            Income
          </button>
        </div>

        {loading ? (
          <div style={{ opacity: 0.75 }}>Loading…</div>
        ) : filteredItems.length === 0 ? (
          <div style={{ opacity: 0.75 }}>No recurring items for this tab.</div>
        ) : (
          <ul style={uiStyles.list}>
            {filteredItems.map((it) => (
              <li key={it.id} style={uiStyles.item}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <strong>{it.name}</strong>
                    <div style={uiStyles.muted}>
                      {it.frequency} • {it.direction} • {it.isActive ? "active" : "inactive"}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={uiStyles.muted}>
                      {it.versions[0] ? `${(it.versions[0].amountCents / 100).toFixed(2)}` : "-"}
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ display: "grid", gap: 6 }}>
                    <strong style={{ fontSize: 13 }}>Versions</strong>
                    <ul style={uiStyles.versionList}>
                      {it.versions.map((v) => (
                        <li key={v.id} style={{ fontSize: 13, opacity: 0.9 }}>
                          {new Date(v.validFrom).toISOString().slice(0, 10)} —{" "}
                          {v.validTo ? new Date(v.validTo).toISOString().slice(0, 10) : "∞"} •{" "}
                          {(v.amountCents / 100).toFixed(2)}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <AddVersionRow
                    onAdd={(amountCents, s, setErr) => addVersion(it.id, amountCents, s, setErr)}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

// Update AddVersionRow to use shared styles
function AddVersionRow({
  onAdd,
}: {
  onAdd: (
    amountCents: number,
    setSubmitting: (v: boolean) => void,
    setError: (s: string | null) => void
  ) => void;
}) {
  const [amount, setAmount] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  return (
    <div style={uiStyles.addVersionRow}>
      <input
        placeholder="amount (cents)"
        value={amount}
        onChange={(e) => setAmount(e.target.value === "" ? "" : parseInt(e.target.value, 10))}
        style={{ ...uiStyles.input, flex: 1 }}
      />
      <button
        onClick={() => {
          if (typeof amount !== "number" || !Number.isInteger(amount) || amount <= 0) {
            setLocalError("Enter positive integer cents");
            return;
          }
          onAdd(amount as number, setSubmitting, setLocalError);
        }}
        disabled={submitting}
        style={uiStyles.buttonPrimary}
      >
        Add version
      </button>
      {localError && <div style={{ color: "tomato", fontSize: 13 }}>{localError}</div>}
    </div>
  );
}
