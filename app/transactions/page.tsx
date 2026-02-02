"use client";

import { useState, useEffect, FormEvent } from "react";

/* =======================
   Types
======================= */

type Ledger = {
  id: string;
  name: string;
};

type Transaction = {
  id: string;
  ledgerId: string;
  occurredAt: string;
  amountEur: string;
  category: string;
  description: string | null;
  direction: "expense" | "income";
};

const CATEGORIES = [
  "groceries",
  "eating_out",
  "going_out",
  "transport",
  "clothing",
  "health_and_fitness",
  "other",
  "gifts",
  "incidental_income",
];

/* =======================
   Date utils (LOCAL)
======================= */

function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfCurrentMonth(): string {
  const now = new Date();
  return toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1));
}

function endOfCurrentMonth(): string {
  const now = new Date();
  return toDateInputValue(new Date(now.getFullYear(), now.getMonth() + 1, 0));
}

function today(): string {
  return toDateInputValue(new Date());
}

/* =======================
   Page
======================= */

export default function TransactionsPage() {
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [selectedLedger, setSelectedLedger] = useState<string>("");

  const [fromDate, setFromDate] = useState(startOfCurrentMonth());
  const [toDate, setToDate] = useState(endOfCurrentMonth());

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // form fields
  const [amountEur, setAmountEur] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [occurredAt, setOccurredAt] = useState(today());
  const [direction, setDirection] = useState<"expense" | "income">("expense");
  const [creating, setCreating] = useState(false);

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

  /* =======================
     Fetch transactions
  ======================= */

  async function fetchTransactions(ledgerId: string, from: string, to: string) {
    if (!ledgerId || !from || !to) return;
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ ledgerId, from, to });
      const res = await fetch(`/api/transactions?${params}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load transactions");
      setTransactions(await res.json());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedLedger) {
      fetchTransactions(selectedLedger, fromDate, toDate);
    }
  }, [selectedLedger, fromDate, toDate]);

  /* =======================
     Delete transaction
  ======================= */

  async function handleDelete(transactionId: string) {
    if (!confirm("Are you sure you want to delete this transaction?")) {
      return;
    }

    setError(null);

    try {
      const res = await fetch(`/api/transactions/${transactionId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.message ?? "Failed to delete transaction");
      }

      await fetchTransactions(selectedLedger, fromDate, toDate);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  /* =======================
     Create transaction
  ======================= */

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!amountEur.trim()) {
      setError("Amount is required");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const body: any = {
        ledgerId: selectedLedger,
        amountEur: amountEur.trim(),
        category,
        direction,
        occurredAt,
      };
      if (description.trim()) body.description = description.trim();

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.message ?? "Failed to create transaction");
      }

      setAmountEur("");
      setDescription("");
      setCategory(CATEGORIES[0]);
      setOccurredAt(today());
      setDirection("expense");

      await fetchTransactions(selectedLedger, fromDate, toDate);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCreating(false);
    }
  }

  /* =======================
     Render
  ======================= */

  return (
    <div className="min-h-screen p-6 flex justify-center">
      <div className="w-full max-w-4xl space-y-6">
        <h2 className="text-2xl font-semibold">Transactions</h2>

        {error && <div className="text-red-500">{error}</div>}

        {/* CREATE FORM (TOP) */}
        <form onSubmit={handleCreate} className="border border-gray-700 rounded p-4 space-y-4">
          <h3 className="text-lg font-medium">Create transaction</h3>

          <input
            placeholder="Amount (€)"
            value={amountEur}
            onChange={(e) => setAmountEur(e.target.value)}
            className="w-full px-3 py-2 rounded border border-gray-600 bg-transparent"
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 rounded border border-gray-600 bg-transparent"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.replace(/_/g, " ")}
              </option>
            ))}
          </select>

          <input
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 rounded border border-gray-600 bg-transparent"
          />

          <input
            type="date"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
            className="w-full px-3 py-2 rounded border border-gray-600 bg-transparent"
          />

          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value as any)}
            className="w-full px-3 py-2 rounded border border-gray-600 bg-transparent"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>

          <button
            type="submit"
            disabled={creating}
            className="bg-blue-600 px-4 py-2 rounded disabled:opacity-50"
          >
            Create
          </button>
        </form>

        {/* FILTERS */}
        <div className="flex flex-wrap gap-4 items-end">
          <select
            value={selectedLedger}
            onChange={(e) => setSelectedLedger(e.target.value)}
            className="px-3 py-2 rounded border border-gray-600 bg-transparent"
          >
            {ledgers.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-3 py-2 rounded border border-gray-600 bg-transparent"
          />

          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-3 py-2 rounded border border-gray-600 bg-transparent"
          />
        </div>

        {/* TABLE */}
        {loading ? (
          <div>Loading…</div>
        ) : transactions.length === 0 ? (
          <div>No transactions found.</div>
        ) : (
          <table className="w-full border border-gray-700 border-collapse">
            <thead className="bg-gray-800">
              <tr>
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-left">Category</th>
                <th className="p-2 text-left">Description</th>
                <th className="p-2 text-center">Dir</th>
                <th className="p-2 text-right">Amount</th>
                <th className="p-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="odd:bg-gray-900">
                  <td className="p-2">{new Date(tx.occurredAt).toLocaleDateString()}</td>
                  <td className="p-2 capitalize">{tx.category.replace(/_/g, " ")}</td>
                  <td className="p-2">{tx.description ?? "-"}</td>
                  <td className="p-2 text-center">{tx.direction}</td>
                  <td className="p-2 text-right">
                    {tx.direction === "expense" ? "-" : "+"}€ {tx.amountEur}
                  </td>
                  <td className="p-2 text-center">
                    <button
                      onClick={() => handleDelete(tx.id)}
                      className="text-red-500 hover:text-red-400 text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
