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
    <span style={{ display: "flex", gap: 4 }}>
      <button onClick={() => resolve("SUCCESS")}>Mark success</button>
      <button onClick={() => resolve("FAILED")}>Mark failed</button>
    </span>
  );
}
