"use client";

import { useRouter } from "next/navigation";

export function ResolveButton({ transactionId }: { transactionId: string }) {
  const router = useRouter();

  async function resolve(resolution: "SUCCESS" | "FAILED") {
    const res = await fetch(`/api/admin/transactions/${transactionId}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolution }),
    });
    if (res.ok) router.refresh();
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => resolve("SUCCESS")}
        className="rounded-md bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700"
      >
        Mark success
      </button>
      <button
        onClick={() => resolve("FAILED")}
        className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
      >
        Mark failed
      </button>
    </div>
  );
}
