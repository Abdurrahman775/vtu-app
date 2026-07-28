"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SERVICES = ["AIRTIME", "DATA", "CABLE_TV"] as const;

export function PricingForm() {
  const router = useRouter();
  const [service, setService] = useState<(typeof SERVICES)[number]>("AIRTIME");
  const [provider, setProvider] = useState("");
  const [marginPercent, setMarginPercent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!provider.trim()) {
      setError("Provider is required");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service, provider: provider.trim(), marginPercent }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? `Request failed (${res.status})`);
        return;
      }
      setProvider("");
      setMarginPercent(0);
      router.refresh();
    } catch {
      setError("Network error — check your connection and try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
        <select
          value={service}
          onChange={(e) => setService(e.target.value as typeof service)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
        >
          {SERVICES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input
          placeholder="Provider (e.g. MTN)"
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
        />
        <input
          type="number"
          placeholder="Margin %"
          value={marginPercent}
          onChange={(e) => setMarginPercent(Number(e.target.value))}
          className="w-28 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
        />
        <button
          onClick={submit}
          disabled={loading}
          className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
