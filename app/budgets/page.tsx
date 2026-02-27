"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import Navigation from "../components/Navigation";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import EmptyState from "../components/ui/EmptyState";

/* =======================
   Types
======================= */

type Ledger = { id: string; name: string };

type BudgetAllocation = {
  id: string;
  ledgerId: string;
  userId: string;
  yearMonth: string;
  category: string | null;
  name: string | null;
  budgetAmountEur: string;
};

type BudgetTotals = {
  recurringIncomeEur: string;
  recurringExpensesEur: string;
  availableToBudgetEur: string;
  allocatedBudgetEur: string;
  remainingToAllocateEur: string;
};

type BudgetOverview = {
  ledgerId: string;
  yearMonth: string;
  totals: BudgetTotals;
  allocations: BudgetAllocation[];
};

/* =======================
   Constants
======================= */

const CATEGORIES = [
  "groceries",
  "eating_out",
  "going_out",
  "transport",
  "clothing",
  "health_and_fitness",
  "other",
  "gifts",
] as const;

const categoryMeta: Record<string, { label: string; icon: string; bar: string }> = {
  groceries:          { label: "Groceries",       icon: "🛒", bar: "bg-emerald-500" },
  eating_out:         { label: "Eating Out",       icon: "🍽️", bar: "bg-orange-500"  },
  going_out:          { label: "Going Out",        icon: "🎉", bar: "bg-purple-500"  },
  transport:          { label: "Transport",         icon: "🚗", bar: "bg-blue-500"    },
  clothing:           { label: "Clothing",          icon: "👕", bar: "bg-pink-500"    },
  health_and_fitness: { label: "Health & Fitness", icon: "💪", bar: "bg-cyan-500"    },
  other:              { label: "Other",             icon: "📦", bar: "bg-slate-400"   },
  gifts:              { label: "Gifts",             icon: "🎁", bar: "bg-rose-500"    },
};

/* =======================
   Utils
======================= */

function getCurrentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function monthDateRange(yearMonth: string): { from: string; to: string } {
  const [y, m] = yearMonth.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return {
    from: `${yearMonth}-01`,
    to: `${yearMonth}-${String(lastDay).padStart(2, "0")}`,
  };
}

function formatEur(amount: string | number): string {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(n);
}

/* =======================
   Sub-components
======================= */

function StatCard({ label, value, color, sub }: {
  label: string; value: string; color: "emerald" | "red" | "blue" | "amber"; sub?: string;
}) {
  const textColors = { emerald: "text-emerald-400", red: "text-red-400", blue: "text-blue-400", amber: "text-amber-400" };
  return (
    <Card padding="md">
      <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${textColors[color]}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </Card>
  );
}

function SpendingBar({ spent, budget }: { spent: number; budget: number }) {
  const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const isOver = spent > budget;
  const barClass = isOver ? "bg-red-500" : pct >= 85 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
      <div className={`h-2 rounded-full transition-all duration-700 ${barClass}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function CategoryCard({
  alloc, spent, isEditing, editAmount, isSaving, isDeleting,
  onStartEdit, onEditChange, onSave, onCancelEdit, onDelete,
}: {
  alloc: BudgetAllocation; spent: number; isEditing: boolean; editAmount: string;
  isSaving: boolean; isDeleting: boolean; onStartEdit: () => void;
  onEditChange: (v: string) => void; onSave: () => void; onCancelEdit: () => void; onDelete: () => void;
}) {
  const isSavings = !alloc.category;
  const meta = alloc.category ? categoryMeta[alloc.category] : null;
  const displayLabel = isSavings ? (alloc.name ?? "Savings") : (meta?.label ?? alloc.category);
  const displayIcon = isSavings ? "💰" : (meta?.icon ?? "📦");
  const budget = parseFloat(alloc.budgetAmountEur);
  const left = budget - spent;
  const isOver = left < 0;
  const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;

  return (
    <Card padding="md" className="relative group flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-2xl shrink-0">{displayIcon}</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{displayLabel}</p>
            {isSavings
              ? <p className="text-xs text-emerald-500/70">savings goal</p>
              : <p className="text-xs text-slate-500">{formatEur(spent)} spent of {formatEur(budget)}</p>
            }
          </div>
        </div>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-red-400 text-xl leading-none disabled:opacity-30"
          title="Remove"
        >
          {isDeleting ? "…" : "×"}
        </button>
      </div>

      {/* Budget amount / edit */}
      {isEditing ? (
        <div className="flex flex-col gap-2">
          <Input
            value={editAmount}
            onChange={(e) => onEditChange(e.target.value)}
            autoFocus
            inputMode="decimal"
            placeholder="Budget amount"
            fullWidth
            onKeyDown={(e) => {
              if (e.key === "Enter") onSave();
              if (e.key === "Escape") onCancelEdit();
            }}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={onSave} disabled={isSaving || !editAmount} className="flex-1">
              {isSaving ? "Saving…" : "Save"}
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancelEdit}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <button className="text-left group/amount" onClick={onStartEdit} title="Click to edit budget">
          <span className="text-2xl font-bold text-white group-hover/amount:text-emerald-400 transition-colors">
            {formatEur(budget)}
          </span>
          <span className="text-xs text-slate-500 ml-2">budget</span>
        </button>
      )}

      {/* Progress bar + remaining */}
      {!isSavings && (
        <div className="space-y-1.5">
          <SpendingBar spent={spent} budget={budget} />
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">{pct.toFixed(0)}% used</span>
            <span className={isOver ? "text-red-400 font-semibold" : "text-slate-400"}>
              {isOver ? `${formatEur(Math.abs(left))} over` : `${formatEur(left)} left`}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}

/* =======================
   Page
======================= */

export default function BudgetsPage() {
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [selectedLedger, setSelectedLedger] = useState<string>("");
  const [yearMonth, setYearMonth] = useState<string>(getCurrentYearMonth());

  const [overview, setOverview] = useState<BudgetOverview | null>(null);
  const [spending, setSpending] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [addType, setAddType] = useState<"category" | "savings">("category");
  const [addCategory, setAddCategory] = useState<string>("");
  const [addName, setAddName] = useState<string>("");
  const [addAmount, setAddAmount] = useState<string>("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const fetchData = useCallback(async () => {
    if (!selectedLedger || !yearMonth) return;
    setLoading(true);
    setError(null);
    try {
      const { from, to } = monthDateRange(yearMonth);
      const [budgetRes, spendingRes] = await Promise.all([
        fetch(`/api/budgets?${new URLSearchParams({ ledgerId: selectedLedger, yearMonth })}`, { credentials: "include" }),
        fetch(`/api/analytics/expenses-summary?${new URLSearchParams({ ledgerId: selectedLedger, from, to })}`, { credentials: "include" }),
      ]);
      if (!budgetRes.ok) throw new Error("Failed to load budget overview");
      if (!spendingRes.ok) throw new Error("Failed to load spending data");
      const [budgetData, spendingData]: [BudgetOverview, { perCategoryEur: Record<string, string> }] =
        await Promise.all([budgetRes.json(), spendingRes.json()]);
      setOverview(budgetData);
      setSpending(spendingData.perCategoryEur ?? {});
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [selectedLedger, yearMonth]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const usedCategories = new Set(
    overview?.allocations.filter((a) => a.category).map((a) => a.category as string) ?? []
  );
  const availableCategories = CATEGORIES.filter((c) => !usedCategories.has(c));

  useEffect(() => {
    if (!addCategory || usedCategories.has(addCategory)) {
      setAddCategory(availableCategories[0] ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overview]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!selectedLedger || !addAmount) return;
    if (addType === "category" && !addCategory) return;
    if (addType === "savings" && !addName.trim()) return;
    setAdding(true);
    setAddError(null);
    try {
      const body =
        addType === "category"
          ? { ledgerId: selectedLedger, yearMonth, category: addCategory, budgetAmountEur: addAmount }
          : { ledgerId: selectedLedger, yearMonth, name: addName.trim(), budgetAmountEur: addAmount };
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message ?? "Failed to create budget allocation");
      }
      setAddAmount("");
      setAddName("");
      await fetchData();
    } catch (e) {
      setAddError((e as Error).message);
    } finally {
      setAdding(false);
    }
  }

  async function handleSaveEdit(id: string) {
    setSavingId(id);
    try {
      const res = await fetch(`/api/budgets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ budgetAmountEur: editAmount }),
      });
      if (!res.ok) throw new Error("Failed to update budget allocation");
      setEditingId(null);
      await fetchData();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/budgets/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete budget allocation");
      await fetchData();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeletingId(null);
    }
  }

  const available = overview ? parseFloat(overview.totals.availableToBudgetEur) : 0;
  const allocated = overview ? parseFloat(overview.totals.allocatedBudgetEur) : 0;
  const remaining = overview ? parseFloat(overview.totals.remainingToAllocateEur) : 0;
  const totalSpent = Object.values(spending).reduce((sum, v) => sum + parseFloat(v), 0);
  const allocatedPct = available > 0 ? Math.min((allocated / available) * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navigation />
      <main className="lg:pl-64 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-1">Budgets</h1>
            <p className="text-slate-400">Plan and track your monthly spending</p>
          </div>

          <div className="flex flex-wrap items-end gap-4 mb-8">
            <Select
              label="Ledger"
              value={selectedLedger}
              onChange={(e) => setSelectedLedger(e.target.value)}
              options={ledgers.map((l) => ({ value: l.id, label: l.name }))}
              disabled={ledgers.length === 0}
            />
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Month</label>
              <input
                type="month"
                value={yearMonth}
                onChange={(e) => setYearMonth(e.target.value)}
                className="px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-24"><LoadingSpinner /></div>
          ) : overview ? (
            <div className="space-y-6">
              {/* Stat cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard label="Monthly Income"  value={formatEur(overview.totals.recurringIncomeEur)}  color="emerald" sub="recurring" />
                <StatCard label="Fixed Expenses"  value={formatEur(overview.totals.recurringExpensesEur)} color="red"    sub="recurring" />
                <StatCard
                  label="Total Spent"
                  value={formatEur(totalSpent)}
                  color={totalSpent > allocated ? "red" : "blue"}
                  sub="variable this month"
                />
                <StatCard
                  label={remaining < 0 ? "Over Budget" : "Left"}
                  value={formatEur(Math.abs(remaining))}
                  color={remaining < 0 ? "red" : "amber"}
                  sub={remaining < 0 ? "reduce allocations" : "after budget"}
                />
              </div>

              {/* Planning progress bar */}
              <Card padding="md">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="text-base font-semibold text-white">Budget Planning</h2>
                    <p className="text-sm text-slate-400 mt-0.5">
                      {formatEur(allocated)} planned of {formatEur(available)} available after fixed costs
                    </p>
                  </div>
                  <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                    allocatedPct >= 100 ? "bg-red-900/40 text-red-400" :
                    allocatedPct >= 85  ? "bg-amber-900/40 text-amber-400" :
                                          "bg-emerald-900/40 text-emerald-400"
                  }`}>
                    {allocatedPct.toFixed(0)}% planned
                  </span>
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-3 rounded-full transition-all duration-700 ${
                      allocatedPct >= 100 ? "bg-red-500" : allocatedPct >= 85 ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${allocatedPct}%` }}
                  />
                </div>
                {overview.allocations.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {overview.allocations.map((alloc) => {
                      const isSavings = !alloc.category;
                      const meta = alloc.category ? categoryMeta[alloc.category] : null;
                      const spentAmt = alloc.category ? parseFloat(spending[alloc.category] ?? "0") : 0;
                      const budgetAmt = parseFloat(alloc.budgetAmountEur);
                      const isOver = !isSavings && spentAmt > budgetAmt;
                      return (
                        <span key={alloc.id} className="flex items-center gap-1.5 text-xs text-slate-400">
                          <span className={`w-2 h-2 rounded-full inline-block ${isOver ? "bg-red-500" : isSavings ? "bg-emerald-500" : (meta?.bar ?? "bg-slate-500")}`} />
                          {isSavings ? "💰" : meta?.icon} {isSavings ? (alloc.name ?? "Savings") : (meta?.label ?? alloc.category)}
                        </span>
                      );
                    })}
                  </div>
                )}
              </Card>

              {/* Category cards — spent vs budget */}
              {(() => {
                const categoryAllocs = overview.allocations.filter((a) => a.category);
                const savingsAllocs = overview.allocations.filter((a) => !a.category);
                const renderCard = (alloc: BudgetAllocation) => (
                  <CategoryCard
                    key={alloc.id}
                    alloc={alloc}
                    spent={alloc.category ? parseFloat(spending[alloc.category] ?? "0") : 0}
                    isEditing={editingId === alloc.id}
                    editAmount={editAmount}
                    isSaving={savingId === alloc.id}
                    isDeleting={deletingId === alloc.id}
                    onStartEdit={() => { setEditingId(alloc.id); setEditAmount(alloc.budgetAmountEur); }}
                    onEditChange={setEditAmount}
                    onSave={() => handleSaveEdit(alloc.id)}
                    onCancelEdit={() => setEditingId(null)}
                    onDelete={() => handleDelete(alloc.id)}
                  />
                );
                if (overview.allocations.length === 0) {
                  return <EmptyState icon="🎯" title="No budget allocations yet" description="Add your first budget allocation below to start planning this month." />;
                }
                return (
                  <div className="space-y-6">
                    {categoryAllocs.length > 0 && (
                      <div>
                        <p className="text-xs uppercase tracking-wider text-slate-500 mb-3">Spending categories</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {categoryAllocs.map(renderCard)}
                        </div>
                      </div>
                    )}
                    {categoryAllocs.length > 0 && savingsAllocs.length > 0 && (
                      <div className="border-t border-slate-700/60" />
                    )}
                    {savingsAllocs.length > 0 && (
                      <div>
                        <p className="text-xs uppercase tracking-wider text-slate-500 mb-3">Savings &amp; investments</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {savingsAllocs.map(renderCard)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Add form */}
              <Card padding="md">
                <h2 className="text-base font-semibold text-white mb-4">Add Budget Allocation</h2>

                {/* Type toggle */}
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setAddType("category")}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      addType === "category"
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    📦 Category
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddType("savings")}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      addType === "savings"
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    💰 Savings / Investment
                  </button>
                </div>

                <form onSubmit={handleAdd} className="flex flex-wrap gap-4 items-end">
                  {addType === "category" ? (
                    availableCategories.length > 0 ? (
                      <Select
                        label="Category"
                        value={addCategory}
                        onChange={(e) => setAddCategory(e.target.value)}
                        options={availableCategories.map((c) => ({
                          value: c,
                          label: `${categoryMeta[c]?.icon ?? ""} ${categoryMeta[c]?.label ?? c}`,
                        }))}
                      />
                    ) : (
                      <p className="text-sm text-slate-400 self-center">🎉 All categories are allocated for this month.</p>
                    )
                  ) : (
                    <Input
                      label="Goal name"
                      placeholder="e.g. Emergency fund, ETF"
                      value={addName}
                      onChange={(e) => setAddName(e.target.value)}
                      type="text"
                    />
                  )}
                  <Input
                    label="Amount (€)"
                    placeholder="e.g. 300"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                    inputMode="decimal"
                    type="text"
                  />
                  <Button
                    type="submit"
                    disabled={
                      adding ||
                      !addAmount ||
                      (addType === "category" && (!addCategory || availableCategories.length === 0)) ||
                      (addType === "savings" && !addName.trim())
                    }
                  >
                    {adding ? "Adding…" : "Add Allocation"}
                  </Button>
                </form>
                {addError && <p className="mt-3 text-sm text-red-400">{addError}</p>}
              </Card>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}

