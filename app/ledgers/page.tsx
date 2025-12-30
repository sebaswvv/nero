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

  async function loadLedgers() {
    const res = await fetch("/api/ledgers");
    if (res.ok) setLedgers(await res.json());
  }

  async function createLedger() {
    await fetch("/api/ledgers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type }),
    });
    setName("");
    loadLedgers();
  }

  useEffect(() => {
    loadLedgers();
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h2>Your ledgers</h2>

      <ul>
        {ledgers.map((l) => (
          <li key={l.id}>
            {l.name} ({l.type})
          </li>
        ))}
      </ul>

      <h3>Create ledger</h3>
      <input
        placeholder="Ledger name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <select value={type} onChange={(e) => setType(e.target.value as any)}>
        <option value="personal">Personal</option>
        <option value="household">Household</option>
      </select>
      <button onClick={createLedger}>Create</button>
    </main>
  );
}
