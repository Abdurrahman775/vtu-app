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
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
      <select value={service} onChange={(e) => setService(e.target.value as typeof service)}>
        {SERVICES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <input placeholder="Provider (e.g. MTN)" value={provider} onChange={(e) => setProvider(e.target.value)} />
      <input
        type="number"
        placeholder="Margin %"
        value={marginPercent}
        onChange={(e) => setMarginPercent(Number(e.target.value))}
      />
      <button onClick={submit}>Save</button>
    </div>
  );
}
