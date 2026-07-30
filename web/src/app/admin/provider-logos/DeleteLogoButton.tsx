"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteLogoButton({ provider }: { provider: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function remove() {
    setLoading(true);
    try {
      await fetch(`/api/admin/provider-logos/${encodeURIComponent(provider)}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={remove}
      disabled={loading}
      className="text-sm text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
    >
      {loading ? "Removing…" : "Remove"}
    </button>
  );
}
