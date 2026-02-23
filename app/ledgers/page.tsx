// 'use client' ensures this page runs on the client side so we can use React hooks
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

type Ledger = {
  id: string;
  name: string;
  type: string;
};

/**
 * LedgersPage lists all ledgers that the current user is a member of and
 * provides a simple form for creating a new ledger.  The form requires a
 * name and a type (personal or household).  After a ledger is created the
 * list is refreshed automatically.
 */
export default function LedgersPage() {
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [name, setName] = useState<string>("");
  const [type, setType] = useState<"personal" | "household">("personal");
  const [loading, setLoading] = useState<boolean>(true);
  const [creating, setCreating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /** Load the current list of ledgers from the backend. */
  async function fetchLedgers() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ledgers", { credentials: "include" });
      if (!res.ok) {
        throw new Error("Failed to load ledgers");
      }
      const data: Ledger[] = await res.json();
      setLedgers(data);
    } catch (err) {
      console.error(err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLedgers();
  }, []);

  /** Submit handler to create a new ledger. */
  async function handleCreateLedger(e: FormEvent) {
    e.preventDefault();
    // basic validation
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/ledgers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name: name.trim(), type }),
      });
      if (!res.ok) {
        // parse backend error if provided
        let message = "Failed to create ledger";
        try {
          const errData = await res.json();
          message = errData?.message ?? message;
        } catch {
          // ignore parse errors
        }
        throw new Error(message);
      }
      // reset form and refresh list
      setName("");
      setType("personal");
      await fetchLedgers();
    } catch (err) {
      console.error(err);
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <Navigation />
      <div className="lg:ml-64 min-h-screen">
        <div className="max-w-4xl mx-auto p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Ledgers</h1>
            <p className="text-slate-400">Manage your financial ledgers</p>
          </div>

          {/* Create ledger form */}
          <Card className="mb-8">
            <form onSubmit={handleCreateLedger} className="space-y-4">
              <h3 className="text-xl font-semibold text-white">Create New Ledger</h3>

              {error && (
                <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  type="text"
                  label="Ledger Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Household, Personal"
                  fullWidth
                />

                <Select
                  label="Type"
                  value={type}
                  onChange={(e) => setType(e.target.value as "personal" | "household")}
                  options={[
                    { value: "personal", label: "Personal" },
                    { value: "household", label: "Household" },
                  ]}
                  fullWidth
                />
              </div>

              <Button type="submit" disabled={creating} variant="primary">
                {creating ? "Creating..." : "Create Ledger"}
              </Button>
            </form>
          </Card>

          {/* Ledger list */}
          <Card>
            <h3 className="text-xl font-semibold text-white mb-4">Your Ledgers</h3>

            {loading ? (
              <LoadingSpinner className="py-12" />
            ) : ledgers.length === 0 ? (
              <EmptyState
                icon="📒"
                title="No ledgers yet"
                description="Create your first ledger to start tracking your finances"
              />
            ) : (
              <div className="space-y-3">
                {ledgers.map((ledger) => (
                  <div
                    key={ledger.id}
                    className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
                  >
                    <div>
                      <h4 className="text-white font-medium">{ledger.name}</h4>
                      <p className="text-sm text-slate-400 font-mono">{ledger.id}</p>
                    </div>
                    <Badge variant={ledger.type === "personal" ? "info" : "success"}>
                      {ledger.type}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
