"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteLinkButton({ platform }: { platform: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function remove() {
    setLoading(true);
    try {
      await fetch(`/api/admin/social-links/${encodeURIComponent(platform)}`, { method: "DELETE" });
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
