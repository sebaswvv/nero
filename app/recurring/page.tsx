"use client";

import { useState, useEffect, FormEvent } from "react";
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

type DirectionFilter = "all" | "expense" | "income";

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

  const [filter, setFilter] = useState<DirectionFilter>("all");

  // create item form
  const [name, setName] = useState("");
  const [amountEur, setAmountEur] = useState("");
  const [direction, setDirection] = useState<"expense" | "income">("expense");
  const [validFrom, setValidFrom] = useState(startOfCurrentMonth());
  const [creating, setCreating] = useState(false);

  // version form
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [versionAmount, setVersionAmount] = useState("");
  const [versionValidFrom, setVersionValidFrom] = useState(startOfCurrentMonth());
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
      const res = await fetch("/api/recurring-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ledgerId: selectedLedger,
          name: name.trim(),
          amountEur: amountEur.trim(),
          direction,
          validFrom,
        }),
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
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCreating(false);
    }
  }

  /* =======================
     Delete recurring item
  ======================= */

  async function handleDelete(itemId: string) {
    if (!confirm("Are you sure you want to delete this recurring item?")) {
      return;
    }

    setError(null);

    try {
      const res = await fetch(`/api/recurring-items/${itemId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.message ?? "Failed to delete recurring item");
      }

      await fetchItems(selectedLedger);
    } catch (e) {
      setError((e as Error).message);
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
      const res = await fetch(`/api/recurring-items/${itemId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          amountEur: versionAmount.trim(),
          validFrom: versionValidFrom,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.message ?? "Failed to add version");
      }

      await fetchItems(selectedLedger);
      setEditingItemId(null);
      setVersionAmount("");
      setVersionValidFrom(startOfCurrentMonth());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAddingVersion(false);
    }
  }

  /* =======================
     Filtered items
  ======================= */

  const filteredItems = items.filter((item) => {
    if (filter === "all") return true;
    return item.direction === filter;
  });

  /* =======================
     Render
  ======================= */

  return (
    <>
      <Navigation />
      <div className="lg:ml-64 min-h-screen">
        <div className="max-w-6xl mx-auto p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Recurring Items</h1>
            <p className="text-slate-400">Manage your subscriptions and fixed costs</p>
          </div>

          {error && (
            <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Ledger selector */}
          {ledgers.length > 0 && (
            <Card className="mb-6">
              <Select
                label="Select Ledger"
                value={selectedLedger}
                onChange={(e) => setSelectedLedger(e.target.value)}
                options={ledgers.map((l) => ({ value: l.id, label: l.name }))}
                fullWidth
              />
            </Card>
          )}

          {/* Create form */}
          <Card className="mb-6">
            <form onSubmit={handleCreate} className="space-y-4">
              <h3 className="text-xl font-semibold text-white">Add Recurring Item</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  placeholder="Name (e.g., Netflix, Rent)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  label="Name"
                  fullWidth
                />

                <Input
                  placeholder="Amount"
                  value={amountEur}
                  onChange={(e) => setAmountEur(e.target.value)}
                  label="Amount (€)"
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
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                  label="Valid From"
                  fullWidth
                />
              </div>

              <Button type="submit" disabled={creating} variant="primary">
                {creating ? "Creating..." : "Add Item"}
              </Button>
            </form>
          </Card>

          {/* Filter tabs */}
          <div className="flex gap-2 mb-6">
            {(["all", "expense", "income"] as DirectionFilter[]).map((f) => (
              <Button
                key={f}
                onClick={() => setFilter(f)}
                variant={filter === f ? "primary" : "ghost"}
                size="sm"
              >
                {f === "all" ? "All" : f === "expense" ? "Expenses" : "Income"}
              </Button>
            ))}
          </div>

          {/* Items */}
          {loading ? (
            <Card>
              <LoadingSpinner className="py-12" />
            </Card>
          ) : filteredItems.length === 0 ? (
            <Card>
              <EmptyState
                icon="🔄"
                title="No recurring items"
                description="Add your first recurring item to track subscriptions and fixed costs"
              />
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => {
                const v = item.versions[0];
                return (
                  <Card key={item.id}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold text-white">{item.name}</h4>
                          <Badge
                            variant={item.direction === "income" ? "success" : "danger"}
                            size="sm"
                          >
                            {item.direction}
                          </Badge>
                        </div>
                        <div className="text-slate-400">
                          <span className="text-2xl font-bold text-white">€{v?.amountEur}</span>
                          <span className="text-sm ml-2">per month</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setEditingItemId(item.id)}
                          variant="secondary"
                          size="sm"
                        >
                          Update Amount
                        </Button>
                        <Button onClick={() => handleDelete(item.id)} variant="danger" size="sm">
                          Delete
                        </Button>
                      </div>
                    </div>

                    {editingItemId === item.id && (
                      <div className="mt-4 pt-4 border-t border-slate-700">
                        <h5 className="text-sm font-medium text-slate-300 mb-3">
                          Add New Version
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <Input
                            placeholder="New amount"
                            value={versionAmount}
                            onChange={(e) => setVersionAmount(e.target.value)}
                            label="Amount (€)"
                            fullWidth
                          />
                          <Input
                            type="date"
                            value={versionValidFrom}
                            onChange={(e) => setVersionValidFrom(e.target.value)}
                            label="Valid From"
                            fullWidth
                          />
                          <div className="flex items-end gap-2">
                            <Button
                              onClick={() => handleAddVersion(item.id)}
                              disabled={addingVersion}
                              variant="primary"
                              size="md"
                            >
                              Save
                            </Button>
                            <Button
                              onClick={() => setEditingItemId(null)}
                              variant="ghost"
                              size="md"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
