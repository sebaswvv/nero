"use client";

// component to copy the API key to clipboard, not display it
// /api/key returns the API key when requested
import React, { useState } from "react";

export default function ApiKey() {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchApiKey = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/key");
      if (!res.ok) throw new Error("Failed to fetch API key");
      const data = await res.json();
      await navigator.clipboard.writeText(data.apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={fetchApiKey}
        disabled={loading}
        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-slate-400 hover:text-white hover:bg-slate-800/50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="text-xl">{copied ? "✅" : loading ? "⏳" : "🔑"}</span>
        <span className="font-medium">
          {loading ? "Loading..." : copied ? "Copied!" : "Copy API Key"}
        </span>
      </button>
      {error && (
        <p className="px-4 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
