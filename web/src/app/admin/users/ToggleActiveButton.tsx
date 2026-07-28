"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ToggleActiveButton({ userId, isActive }: { userId: string; isActive: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
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
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={toggle}
        disabled={loading}
        className={`rounded-md px-2 py-1 text-xs font-medium text-white disabled:opacity-50 ${
          isActive ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {loading ? "…" : isActive ? "Suspend" : "Reinstate"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
