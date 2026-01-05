"use client";

import { useEffect, useState } from "react";

type Ledger = {
  id: string;
  name: string;
  type: string;
};

export default function LedgersPage() {
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState<"personal" | "household">("personal");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadLedgers() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ledgers");
      if (!res.ok) throw new Error(`Failed to load ledgers (${res.status})`);
      setLedgers(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load ledgers");
    } finally {
      setLoading(false);
    }
  }

  async function createLedger() {
    if (!name.trim()) {
      setError("Ledger name is required");
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/ledgers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), type }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error ?? `Failed to create ledger (${res.status})`);
      }

      setName("");
      await loadLedgers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create ledger");
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    loadLedgers();
  }, []);

  return (
    <main
      style={{
        padding: 24,
        maxWidth: 720,
        margin: "0 auto",
        display: "grid",
        gap: 16,
      }}
    >
      <header style={{ display: "grid", gap: 6 }}>
        <h2 style={{ margin: 0 }}>Ledgers</h2>
        <p style={{ margin: 0, opacity: 0.75 }}>View your ledgers and create a new one.</p>
      </header>

      {error && (
        <div
          style={{
            padding: 12,
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(255,0,0,0.08)",
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
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h3 style={{ margin: 0, flex: 1 }}>Your ledgers</h3>
          <button onClick={loadLedgers} disabled={loading} style={{ padding: "8px 12px" }}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div style={{ marginTop: 12 }}>
          {loading && ledgers.length === 0 ? (
            <div style={{ opacity: 0.75 }}>Loading…</div>
          ) : ledgers.length === 0 ? (
            <div style={{ opacity: 0.75 }}>No ledgers yet.</div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
              {ledgers.map((l) => (
                <li
                  key={l.id}
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.12)",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "grid", gap: 2 }}>
                    <strong>{l.name}</strong>
                    <span style={{ opacity: 0.7, fontSize: 13 }}>{l.id}</span>
                  </div>
                  <span
                    style={{
                      alignSelf: "flex-start",
                      padding: "4px 10px",
                      borderRadius: 999,
                      border: "1px solid rgba(255,255,255,0.18)",
                      fontSize: 12,
                      opacity: 0.9,
                    }}
                  >
                    {l.type}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section
        style={{
          padding: 16,
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Create ledger</h3>

        <div style={{ display: "grid", gap: 10 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 13, opacity: 0.8 }}>Name</span>
            <input
              placeholder="e.g. Personal, Household"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "transparent",
                color: "inherit",
              }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 13, opacity: 0.8 }}>Type</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "transparent",
                color: "inherit",
              }}
            >
              <option value="personal">Personal</option>
              <option value="household">Household</option>
            </select>
          </label>

          <button
            onClick={createLedger}
            disabled={creating || !name.trim()}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.06)",
              color: "inherit",
              cursor: creating || !name.trim() ? "not-allowed" : "pointer",
            }}
          >
            {creating ? "Creating..." : "Create"}
          </button>
        </div>
      </section>
    </main>
  );
}
