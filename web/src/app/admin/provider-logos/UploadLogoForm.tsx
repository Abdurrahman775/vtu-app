"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Mirrors mobile/lib/src/core/widgets/provider_badge.dart's providerBrands keys. */
const KNOWN_PROVIDERS = [
  "MTN",
  "AIRTEL",
  "GLO",
  "9MOBILE",
  "DSTV",
  "GOTV",
  "STARTIMES",
  "WAEC",
  "NECO",
  "IKEDC",
  "EKEDC",
  "AEDC",
  "PHED",
  "IBEDC",
  "EEDC",
  "KEDCO",
  "JED",
  "KAEDCO",
  "BEDC",
] as const;

export function UploadLogoForm() {
  const router = useRouter();
  const [provider, setProvider] = useState<string>(KNOWN_PROVIDERS[0]);
  const [customProvider, setCustomProvider] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const providerCode = (provider === "OTHER" ? customProvider : provider).trim();
    if (!providerCode) {
      setError("Provider code is required");
      return;
    }
    if (!file) {
      setError("Choose an image file");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("provider", providerCode);
      formData.set("logo", file);

      const res = await fetch("/api/admin/provider-logos", { method: "POST", body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? `Upload failed (${res.status})`);
        return;
      }
      setFile(null);
      setCustomProvider("");
      router.refresh();
    } catch {
      setError("Network error — check your connection and try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-8 rounded-xl bg-white p-4 shadow-sm dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          {KNOWN_PROVIDERS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
          <option value="OTHER">Other…</option>
        </select>
        {provider === "OTHER" && (
          <input
            placeholder="Provider code (e.g. NEW_DISCO)"
            value={customProvider}
            onChange={(e) => setCustomProvider(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        )}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm text-slate-700 dark:text-slate-300"
        />
        <button
          onClick={submit}
          disabled={loading}
          className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50"
        >
          {loading ? "Uploading…" : "Upload logo"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
