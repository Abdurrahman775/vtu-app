"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ResolveButton({ transactionId }: { transactionId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState<"SUCCESS" | "FAILED" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function resolve(resolution: "SUCCESS" | "FAILED") {
    setPending(resolution);
    setError(null);
    try {
      const res = await fetch(`/api/admin/transactions/${transactionId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolution }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? `Request failed (${res.status})`);
        return;
      }
      router.refresh();
    } catch {
      setError("Network error — check your connection and try again");
    } finally {
      setPending(null);
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        <button
          onClick={() => resolve("SUCCESS")}
          disabled={pending !== null}
          className="rounded-md bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {pending === "SUCCESS" ? "Marking…" : "Mark success"}
        </button>
        <button
          onClick={() => resolve("FAILED")}
          disabled={pending !== null}
          className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {pending === "FAILED" ? "Marking…" : "Mark failed"}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
