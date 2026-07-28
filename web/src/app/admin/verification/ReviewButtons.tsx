"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReviewButtons({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function review(decision: "APPROVED" | "REJECTED") {
    setPending(decision);
    setError(null);
    try {
      const res = await fetch(`/api/admin/verification-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? `Request failed (${res.status})`);
        return;
      }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setPending(null);
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        <button
          onClick={() => review("APPROVED")}
          disabled={pending !== null}
          className="rounded-md bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {pending === "APPROVED" ? "…" : "Approve"}
        </button>
        <button
          onClick={() => review("REJECTED")}
          disabled={pending !== null}
          className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {pending === "REJECTED" ? "…" : "Reject"}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
