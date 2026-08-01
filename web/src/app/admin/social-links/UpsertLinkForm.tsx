"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const KNOWN_PLATFORMS = ["INSTAGRAM", "YOUTUBE", "X", "FACEBOOK", "TIKTOK", "WHATSAPP"] as const;

export function UpsertLinkForm() {
  const router = useRouter();
  const [platform, setPlatform] = useState<string>(KNOWN_PLATFORMS[0]);
  const [customPlatform, setCustomPlatform] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const platformCode = (platform === "OTHER" ? customPlatform : platform).trim();
    if (!platformCode) {
      setError("Platform is required");
      return;
    }
    if (!url.trim()) {
      setError("URL is required");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/social-links", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: platformCode, url: url.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? `Request failed (${res.status})`);
        return;
      }
      setUrl("");
      setCustomPlatform("");
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
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          {KNOWN_PLATFORMS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
          <option value="OTHER">Other…</option>
        </select>
        {platform === "OTHER" && (
          <input
            placeholder="Platform (e.g. TELEGRAM)"
            value={customPlatform}
            onChange={(e) => setCustomPlatform(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        )}
        <input
          placeholder="https://..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="min-w-[240px] flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
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
