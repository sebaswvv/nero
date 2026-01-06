'use client';

import { useState, useEffect, FormEvent } from "react";

/* =======================
   Types
======================= */

type Ledger = {
  id: string;
  name: string;
};

type RecurringVersion = {
  amountEur: string;
  validFrom: string;
  validTo: string | null;
};

type RecurringItem = {
  id: string;
  ledgerId: string;
  name: string;
  direction: "expense" | "income";
  isActive: boolean;
  versions: RecurringVersion[];
};

/* =======================
   Utils
======================= */

function startOfCurrentMonth(): string {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const y = first.getFullYear();
  const m = String(first.getMonth() + 1).padStart(2, "0");
  const d = String(first.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/* =======================
   Page
======================= */

export default function RecurringPage() {
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [selectedLedger, setSelectedLedger] = useState<string>("");

  const [items, setItems] = useState<RecurringItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // create item form
  const [name, setName] = useState("");
  const [amountEur, setAmountEur] = useState("");
  const [direction, setDirection] = useState<"expense" | "income">("expense");
  const [isActive, setIsActive] = useState(true);
  const [validFrom, setValidFrom] = useState(startOfCurrentMonth());
  const [validTo, setValidTo] = useState("");
  const [creating, setCreating] = useState(false);

  // version form
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [versionAmount, setVersionAmount] = useState("");
  const [versionValidFrom, setVersionValidFrom] = useState(startOfCurrentMonth());
  const [versionValidTo, setVersionValidTo] = useState("");
  const [addingVersion, setAddingVersion] = useState(false);

  /* =======================
     Init
  ======================= */

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/ledgers", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to load ledgers");
        const data: Ledger[] = await res.json();
        setLedgers(data);
        if (data.length > 0) setSelectedLedger(data[0].id);
      } catch (e) {
        setError((e as Error).message);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (!selectedLedger) return;
    fetchItems(selectedLedger);

    setName("");
    setAmountEur("");
    setDirection("expense");
    setIsActive(true);
    setValidFrom(startOfCurrentMonth());
    setValidTo("");
  }, [selectedLedger]);

  async function fetchItems(ledgerId: string) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ ledgerId });
      const res = await fetch(`/api/recurring-items?${params}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load recurring items");
      setItems(await res.json());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  /* =======================
     Create recurring item
  ======================= */

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !amountEur.trim()) {
      setError("Name and amount are required");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const body: any = {
        ledgerId: selectedLedger,
        name: name.trim(),
        amountEur: amountEur.trim(),
        direction,
        isActive,
        validFrom,
      };
      if (validTo) body.validTo = validTo;

      const res = await fetch("/api/recurring-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.message ?? "Failed to create item");
      }

      await fetchItems(selectedLedger);
      setName("");
      setAmountEur("");
      setDirection("expense");
      setValidFrom(startOfCurrentMonth());
      setValidTo("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCreating(false);
    }
  }

  /* =======================
     Add version
  ======================= */

  async function handleAddVersion(itemId: string) {
    if (!versionAmount.trim()) {
      setError("Amount is required");
      return;
    }

    setAddingVersion(true);
    setError(null);

    try {
      const body: any = {
        amountEur: versionAmount.trim(),
        validFrom: versionValidFrom,
      };
      if (versionValidTo) body.validTo = versionValidTo;

      const res = await fetch(
        `/api/recurring-items/${itemId}/versions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.message ?? "Failed to add version");
      }

      await fetchItems(selectedLedger);
      setEditingItemId(null);
      setVersionAmount("");
      setVersionValidFrom(startOfCurrentMonth());
      setVersionValidTo("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAddingVersion(false);
    }
  }

  /* =======================
     Render
  ======================= */

  return (
    <div className="min-h-screen p-6 flex justify-center">
      <div className="w-full max-w-4xl space-y-6">
        <h2 className="text-2xl font-semibold">Recurring items</h2>

        {error && <div className="text-red-500">{error}</div>}

        <select
          value={selectedLedger}
          onChange={(e) => setSelectedLedger(e.target.value)}
          className="px-3 py-2 rounded border border-gray-600 bg-transparent"
        >
          {ledgers.map(l => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>

        {loading ? (
          <div>Loading…</div>
        ) : (
          <div className="space-y-4">
            {items.map(item => {
              const v = item.versions[0];
              return (
                <div key={item.id} className="border border-gray-700 rounded p-4 space-y-2">
                  <div className="flex justify-between">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm opacity-70">
                        {v?.amountEur} € · {item.direction}
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingItemId(item.id)}
                      className="text-sm text-blue-400"
                    >
                      Add version
                    </button>
                  </div>

                  {editingItemId === item.id && (
                    <div className="grid grid-cols-4 gap-2 pt-2">
                      <input
                        placeholder="Amount"
                        value={versionAmount}
                        onChange={e => setVersionAmount(e.target.value)}
                        className="px-2 py-1 rounded border border-gray-600 bg-transparent"
                      />
                      <input
                        type="date"
                        value={versionValidFrom}
                        onChange={e => setVersionValidFrom(e.target.value)}
                        className="px-2 py-1 rounded border border-gray-600 bg-transparent"
                      />
                      <input
                        type="date"
                        value={versionValidTo}
                        onChange={e => setVersionValidTo(e.target.value)}
                        className="px-2 py-1 rounded border border-gray-600 bg-transparent"
                      />
                      <button
                        onClick={() => handleAddVersion(item.id)}
                        disabled={addingVersion}
                        className="bg-blue-600 rounded px-2 py-1 disabled:opacity-50"
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <form onSubmit={handleCreate} className="border border-gray-700 rounded p-4 space-y-4">
          <h3 className="text-lg font-medium">Create recurring item</h3>

          <input
            placeholder="Name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2 rounded border border-gray-600 bg-transparent"
          />

          <input
            placeholder="Amount (€)"
            value={amountEur}
            onChange={e => setAmountEur(e.target.value)}
            className="w-full px-3 py-2 rounded border border-gray-600 bg-transparent"
          />

          <select
            value={direction}
            onChange={e => setDirection(e.target.value as "expense" | "income")}
            className="w-full px-3 py-2 rounded border border-gray-600 bg-transparent"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>

          <input
            type="date"
            value={validFrom}
            onChange={e => setValidFrom(e.target.value)}
            className="w-full px-3 py-2 rounded border border-gray-600 bg-transparent"
          />

          <button
            type="submit"
            disabled={creating}
            className="bg-blue-600 px-4 py-2 rounded disabled:opacity-50"
          >
            Create
          </button>
        </form>
      </div>
    </div>
  );
}
