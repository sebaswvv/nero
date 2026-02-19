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

function startOfMonth(date: Date): string {
  return toDateInputValue(new Date(date.getFullYear(), date.getMonth(), 1));
}

function endOfMonth(date: Date): string {
  return toDateInputValue(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

function today(): string {
  return toDateInputValue(new Date());
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("nl-NL", { month: "long", year: "numeric" });
}

// Group transactions by date
function groupTransactionsByDate(transactions: Transaction[]): Map<string, Transaction[]> {
  const grouped = new Map<string, Transaction[]>();
  
  transactions.forEach((tx) => {
    const date = new Date(tx.occurredAt).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    
    if (!grouped.has(date)) {
      grouped.set(date, []);
    }
    grouped.get(date)!.push(tx);
  });
  
  return grouped;
}

// Get category icon/emoji
function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    groceries: "🛒",
    eating_out: "🍽️",
    going_out: "🎉",
    transport: "🚗",
    clothing: "👕",
    health_and_fitness: "💪",
    other: "📦",
    gifts: "🎁",
    incidental_income: "💰",
  };
  return icons[category] || "💳";
}

/* =======================
   Page
======================= */

export default function TransactionsPage() {
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [selectedLedger, setSelectedLedger] = useState<string>("");

  // Month navigation
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [fromDate, setFromDate] = useState(startOfMonth(new Date()));
  const [toDate, setToDate] = useState(endOfMonth(new Date()));

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Show/hide forms
  const [showCreateForm, setShowCreateForm] = useState(false);

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

  // Month navigation handlers
  function goToPreviousMonth() {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    setCurrentMonth(newMonth);
    setFromDate(startOfMonth(newMonth));
    setToDate(endOfMonth(newMonth));
  }

  function goToNextMonth() {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    setCurrentMonth(newMonth);
    setFromDate(startOfMonth(newMonth));
    setToDate(endOfMonth(newMonth));
  }

  function goToCurrentMonth() {
    const now = new Date();
    setCurrentMonth(now);
    setFromDate(startOfMonth(now));
    setToDate(endOfMonth(now));
  }

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
      setShowCreateForm(false);

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

  const groupedTransactions = React.useMemo(() => {
    return groupTransactionsByDate(transactions);
  }, [transactions]);

  // Get months for selector (previous, current, next)
  const months = React.useMemo(() => {
    const prev = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    return [prev, currentMonth, next];
  }, [currentMonth]);

  return (
    <>
      <Navigation />
      <div className="lg:ml-64 min-h-screen bg-black">
        <div className="max-w-3xl mx-auto p-4">
          {/* Month Selector */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6 py-2">
            {/* Month Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto">
              {months.map((month, idx) => {
                const isSelected = month.getTime() === currentMonth.getTime();
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentMonth(month);
                      setFromDate(startOfMonth(month));
                      setToDate(endOfMonth(month));
                    }}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                      isSelected
                        ? "bg-white text-black font-medium"
                        : "bg-transparent text-slate-400 hover:text-white"
                    }`}
                  >
                    {formatMonthYear(month)}
                  </button>
                );
              })}
            </div>
            
            {/* Month Picker & Today Button */}
            <div className="flex items-center gap-2">
              <input
                type="month"
                value={`${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}`}
                onChange={(e) => {
                  const [year, month] = e.target.value.split("-");
                  const newMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
                  setCurrentMonth(newMonth);
                  setFromDate(startOfMonth(newMonth));
                  setToDate(endOfMonth(newMonth));
                }}
                className="px-3 py-2 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-sm hover:border-slate-600 focus:border-blue-500 focus:outline-none transition-colors cursor-pointer"
              />
              <Button onClick={goToCurrentMonth} variant="secondary" size="sm">
                Today
              </Button>
            </div>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Ledger Selector */}
          {ledgers.length > 1 && (
            <div className="mb-4">
              <Select
                value={selectedLedger}
                onChange={(e) => setSelectedLedger(e.target.value)}
                options={ledgers.map((l) => ({ value: l.id, label: l.name }))}
                fullWidth
              />
            </div>
          )}

          {/* Add Transaction Button */}
          {!showCreateForm && !editingId && (
            <div className="mb-4">
              <Button
                onClick={() => setShowCreateForm(true)}
                variant="primary"
                className="w-full"
              >
                + Add Transaction
              </Button>
            </div>
          )}

          {/* CREATE FORM */}
          {showCreateForm && (
            <Card className="mb-4">
              <form onSubmit={handleCreate} className="space-y-4">
                <h3 className="text-xl font-semibold text-white">Add Transaction</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                <div className="flex gap-2">
                  <Button type="submit" disabled={creating} variant="primary">
                    {creating ? "Adding..." : "Add"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    variant="secondary"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* TRANSACTIONS LIST */}
          {loading ? (
            <LoadingSpinner className="py-12" />
          ) : transactions.length === 0 ? (
            <EmptyState
              icon="💰"
              title="No transactions found"
              description="Add your first transaction to start tracking your finances"
            />
          ) : (
            <div className="space-y-6">
              {Array.from(groupedTransactions.entries()).map(([date, dayTransactions]) => {
                const dayTotal = dayTransactions.reduce(
                  (sum, tx) => {
                    const amount = parseFloat(tx.amountEur);
                    return tx.direction === "income" ? sum + amount : sum - amount;
                  },
                  0
                );

                return (
                  <div key={date}>
                    {/* Date Header */}
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white font-medium">{date}</h3>
                      <span
                        className={`text-sm ${
                          dayTotal >= 0 ? "text-emerald-400" : "text-slate-400"
                        }`}
                      >
                        €{Math.abs(dayTotal).toFixed(2)}
                      </span>
                    </div>

                    {/* Day Transactions */}
                    <div className="space-y-2">
                      {dayTransactions.map((tx) => {
                        const isEditing = editingId === tx.id;
                        const txDate = new Date(tx.occurredAt);
                        const timeStr = txDate.toLocaleTimeString("nl-NL", {
                          hour: "2-digit",
                          minute: "2-digit",
                        });

                        if (isEditing) {
                          // EDIT FORM
                          return (
                            <Card key={tx.id} className="border border-blue-500/50">
                              <form onSubmit={handleUpdate} className="space-y-4">
                                <h3 className="text-lg font-semibold text-white">Edit Transaction</h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                  <Button
                                    type="button"
                                    onClick={() => {
                                      cancelEdit();
                                      handleDelete(tx.id);
                                    }}
                                    disabled={updating}
                                    variant="danger"
                                    size="sm"
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </form>
                            </Card>
                          );
                        }

                        // NORMAL VIEW - Transaction Card
                        return (
                          <div
                            key={tx.id}
                            onClick={() => startEdit(tx)}
                            className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg hover:bg-slate-800/70 transition-colors cursor-pointer"
                          >
                            {/* Icon */}
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl">
                              {getCategoryIcon(tx.category)}
                            </div>

                            {/* Transaction Info */}
                            <div className="flex-1 min-w-0">
                              <div className="text-white font-medium truncate">
                                {tx.description || tx.category.replace(/_/g, " ")}
                              </div>
                              <div className="text-sm text-slate-400">
                                {timeStr} · {tx.category.replace(/_/g, " ")}
                              </div>
                            </div>

                            {/* Amount */}
                            <div className="text-right">
                              <div
                                className={`text-lg font-medium ${
                                  tx.direction === "expense" ? "text-white" : "text-emerald-400"
                                }`}
                              >
                                {tx.direction === "expense" ? "-" : "+"}€{tx.amountEur}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
