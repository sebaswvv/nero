"use client";

// component to copy the API key to clipboard, not display it
// /api/key returns the API key when requested
import React, { useState } from "react";

export default function ApiKey() {
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [apiKey, setApiKey] = useState<string | null>(null);  

    const fetchApiKey = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/key");
            if (!res.ok) {
                throw new Error("Failed to fetch API key");
            }
            const data = await res.json();
            setApiKey(data.apiKey);
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
        <div>
            <button
                onClick={fetchApiKey}
                disabled={loading}
                className="px-4 py-2 rounded bg-gray-800 border border-gray-700"
            >
                {loading ? "Loading..." : "Copy API Key"}
            </button>
            {copied && <span className="ml-2 text-green-500">Copied!</span>}
            {error && <div className="mt-2 text-red-500">Error: {error}</div>}
        </div>
    );
}