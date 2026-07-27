"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SERVICES = ["AIRTIME", "DATA", "CABLE_TV"] as const;

export function PricingForm() {
  const router = useRouter();
  const [service, setService] = useState<(typeof SERVICES)[number]>("AIRTIME");
  const [provider, setProvider] = useState("");
  const [marginPercent, setMarginPercent] = useState(0);

  async function submit() {
    await fetch("/api/admin/pricing", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ service, provider, marginPercent }),
    });
    router.refresh();
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
      <select
        value={service}
        onChange={(e) => setService(e.target.value as typeof service)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      >
        {SERVICES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <input
        placeholder="Provider (e.g. MTN)"
        value={provider}
        onChange={(e) => setProvider(e.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <input
        type="number"
        placeholder="Margin %"
        value={marginPercent}
        onChange={(e) => setMarginPercent(Number(e.target.value))}
        className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <button
        onClick={submit}
        className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
      >
        Save
      </button>
    </div>
  );
}
