// 'use client' ensures this page runs on the client side so we can use React hooks
'use client';

import { useState, useEffect, FormEvent } from "react";

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
    <div className="min-h-screen p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-6">
        <h2 className="text-2xl font-semibold">Ledgers</h2>
        {/* Ledger list */}
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : ledgers.length === 0 ? (
          <div>No ledgers yet. Create one below.</div>
        ) : (
          <ul className="divide-y divide-gray-700 border border-gray-700 rounded">
            {ledgers.map((ledger) => (
              <li key={ledger.id} className="p-3 flex justify-between">
                <span>{ledger.name}</span>
                <span className="text-sm opacity-70">{ledger.type}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Create ledger form */}
        <form onSubmit={handleCreateLedger} className="space-y-4 border border-gray-700 rounded p-4">
          <h3 className="text-lg font-medium">Create new ledger</h3>
          {error && <div className="text-red-500">{error}</div>}
          <div className="flex flex-col gap-2">
            <label className="text-sm">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-3 py-2 rounded border border-gray-600 bg-transparent"
              placeholder="e.g. Household"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "personal" | "household")}
              className="px-3 py-2 rounded border border-gray-600 bg-transparent"
            >
              <option value="personal">Personal</option>
              <option value="household">Household</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="px-4 py-2 rounded bg-blue-600 disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create ledger"}
          </button>
        </form>
      </div>
    </div>
  );
}