"use client";

import { useState, useEffect, FormEvent } from "react";
import React from "react";
import Navigation from "../components/Navigation";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import EmptyState from "../components/ui/EmptyState";
import Badge from "../components/ui/Badge";

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

  // edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    amountEur: string;
    category: string;
    description: string;
    occurredAt: string;
    direction: "expense" | "income";
  }>({
    amountEur: "",
    category: CATEGORIES[0],
    description: "",
    occurredAt: today(),
    direction: "expense",
  });
  const [updating, setUpdating] = useState(false);

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
     Edit transaction
  ======================= */

  function formatDateForInput(dateString: string): string {
    const date = new Date(dateString);
    return toDateInputValue(date);
  }

  function startEdit(transaction: Transaction) {
    setEditingId(transaction.id);
    setEditForm({
      amountEur: transaction.amountEur,
      category: transaction.category,
      description: transaction.description || "",
      occurredAt: formatDateForInput(transaction.occurredAt),
      direction: transaction.direction,
    });
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({
      amountEur: "",
      category: CATEGORIES[0],
      description: "",
      occurredAt: today(),
      direction: "expense",
    });
  }

  async function handleUpdate(e: FormEvent) {
    e.preventDefault();
    if (!editForm.amountEur.trim()) {
      setError("Amount is required");
      return;
    }

    if (!editingId) return;

    setUpdating(true);
    setError(null);

    try {
      const body: any = {
        amountEur: editForm.amountEur.trim(),
        category: editForm.category,
        direction: editForm.direction,
        occurredAt: editForm.occurredAt,
      };
      
      // Include description even if empty (allows clearing it)
      body.description = editForm.description.trim() || null;

      const res = await fetch(`/api/transactions/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.message ?? "Failed to update transaction");
      }

      cancelEdit();
      await fetchTransactions(selectedLedger, fromDate, toDate);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUpdating(false);
    }
  }

  /* =======================
     Render
  ======================= */

  const totalExpenses = React.useMemo(
    () =>
      transactions
        .filter((tx) => tx.direction === "expense")
        .reduce((sum, tx) => sum + parseFloat(tx.amountEur), 0),
    [transactions]
  );

  const totalIncome = React.useMemo(
    () =>
      transactions
        .filter((tx) => tx.direction === "income")
        .reduce((sum, tx) => sum + parseFloat(tx.amountEur), 0),
    [transactions]
  );

  return (
    <>
      <Navigation />
      <div className="lg:ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Transactions</h1>
            <p className="text-slate-400">Track your income and expenses</p>
          </div>

          {error && (
            <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card padding="sm">
              <div className="text-sm text-slate-400 mb-1">Total Expenses</div>
              <div className="text-2xl font-bold text-red-400">€{totalExpenses.toFixed(2)}</div>
            </Card>
            <Card padding="sm">
              <div className="text-sm text-slate-400 mb-1">Total Income</div>
              <div className="text-2xl font-bold text-emerald-400">€{totalIncome.toFixed(2)}</div>
            </Card>
            <Card padding="sm">
              <div className="text-sm text-slate-400 mb-1">Net</div>
              <div
                className={`text-2xl font-bold ${totalIncome - totalExpenses >= 0 ? "text-emerald-400" : "text-red-400"}`}
              >
                €{(totalIncome - totalExpenses).toFixed(2)}
              </div>
            </Card>
          </div>

          {/* CREATE FORM */}
          <Card className="mb-6">
            <form onSubmit={handleCreate} className="space-y-4">
              <h3 className="text-xl font-semibold text-white">Add Transaction</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input
                  placeholder="Amount"
                  value={amountEur}
                  onChange={(e) => setAmountEur(e.target.value)}
                  label="Amount (€)"
                  fullWidth
                />

                <Select
                  label="Category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  options={CATEGORIES.map((c) => ({
                    value: c,
                    label: c.replace(/_/g, " "),
                  }))}
                  fullWidth
                />

                <Select
                  label="Type"
                  value={direction}
                  onChange={(e) => setDirection(e.target.value as any)}
                  options={[
                    { value: "expense", label: "Expense" },
                    { value: "income", label: "Income" },
                  ]}
                  fullWidth
                />

                <Input
                  type="date"
                  value={occurredAt}
                  onChange={(e) => setOccurredAt(e.target.value)}
                  label="Date"
                  fullWidth
                />

                <div className="sm:col-span-2">
                  <Input
                    placeholder="Optional description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    label="Description"
                    fullWidth
                  />
                </div>
              </div>

              <Button type="submit" disabled={creating} variant="primary">
                {creating ? "Adding..." : "Add Transaction"}
              </Button>
            </form>
          </Card>

          {/* FILTERS */}
          <Card className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Filter Transactions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Ledger"
                value={selectedLedger}
                onChange={(e) => setSelectedLedger(e.target.value)}
                options={ledgers.map((l) => ({ value: l.id, label: l.name }))}
                fullWidth
              />

              <Input
                type="date"
                label="From"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                fullWidth
              />

              <Input
                type="date"
                label="To"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                fullWidth
              />
            </div>
          </Card>

          {/* TRANSACTIONS LIST */}
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">
              Recent Transactions ({transactions.length})
            </h3>

            {loading ? (
              <LoadingSpinner className="py-12" />
            ) : transactions.length === 0 ? (
              <EmptyState
                icon="💰"
                title="No transactions found"
                description="Add your first transaction to start tracking your finances"
              />
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => {
                  const isEditing = editingId === tx.id;

                  if (isEditing) {
                    // EDIT FORM
                    return (
                      <form
                        key={tx.id}
                        onSubmit={handleUpdate}
                        className="p-4 bg-slate-800/50 rounded-lg border border-blue-500/50"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                          <Input
                            placeholder="Amount"
                            value={editForm.amountEur}
                            onChange={(e) =>
                              setEditForm({ ...editForm, amountEur: e.target.value })
                            }
                            label="Amount (€)"
                            fullWidth
                          />

                          <Select
                            label="Category"
                            value={editForm.category}
                            onChange={(e) =>
                              setEditForm({ ...editForm, category: e.target.value })
                            }
                            options={CATEGORIES.map((c) => ({
                              value: c,
                              label: c.replace(/_/g, " "),
                            }))}
                            fullWidth
                          />

                          <Select
                            label="Type"
                            value={editForm.direction}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                direction: e.target.value as "expense" | "income",
                              })
                            }
                            options={[
                              { value: "expense", label: "Expense" },
                              { value: "income", label: "Income" },
                            ]}
                            fullWidth
                          />

                          <Input
                            type="date"
                            value={editForm.occurredAt}
                            onChange={(e) =>
                              setEditForm({ ...editForm, occurredAt: e.target.value })
                            }
                            label="Date"
                            fullWidth
                          />

                          <div className="sm:col-span-2">
                            <Input
                              placeholder="Optional description"
                              value={editForm.description}
                              onChange={(e) =>
                                setEditForm({ ...editForm, description: e.target.value })
                              }
                              label="Description"
                              fullWidth
                            />
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button type="submit" disabled={updating} variant="primary" size="sm">
                            {updating ? "Saving..." : "Save"}
                          </Button>
                          <Button
                            type="button"
                            onClick={cancelEdit}
                            disabled={updating}
                            variant="secondary"
                            size="sm"
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    );
                  }

                  // NORMAL VIEW
                  return (
                    <div
                      key={tx.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <Badge
                            variant={tx.direction === "income" ? "success" : "danger"}
                            size="sm"
                          >
                            {tx.direction}
                          </Badge>
                          <span className="text-sm text-slate-400 capitalize">
                            {tx.category.replace(/_/g, " ")}
                          </span>
                        </div>
                        <div className="text-white font-medium">
                          {tx.description || "No description"}
                        </div>
                        <div className="text-sm text-slate-400 mt-1">
                          {new Date(tx.occurredAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`text-xl font-bold ${tx.direction === "income" ? "text-emerald-400" : "text-red-400"}`}
                        >
                          {tx.direction === "expense" ? "-" : "+"}€{tx.amountEur}
                        </div>
                        <Button onClick={() => startEdit(tx)} variant="secondary" size="sm">
                          Edit
                        </Button>
                        <Button onClick={() => handleDelete(tx.id)} variant="danger" size="sm">
                          Delete
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
