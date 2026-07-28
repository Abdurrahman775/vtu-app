export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { toNaira } from "@/lib/wallet";
import { ResolveButton } from "./ResolveButton";

const statusStyles: Record<string, string> = {
  SUCCESS: "bg-green-100 text-green-700",
  PENDING: "bg-amber-100 text-amber-700",
  FAILED: "bg-red-100 text-red-700",
  REVERSED: "bg-red-100 text-red-700",
};

export default async function AdminTransactionsPage() {
  const transactions = await prisma.transaction.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-slate-900">Transactions</h1>
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="px-4 py-3 font-medium">Reference</th>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Provider</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{t.reference}</td>
                <td className="px-4 py-3 text-slate-900">{t.user.phone}</td>
                <td className="px-4 py-3 text-slate-900">{t.type}</td>
                <td className="px-4 py-3 text-slate-900">{t.provider}</td>
                <td className="px-4 py-3 text-slate-900">₦{toNaira(t.amountKobo).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[t.status]}`}>
                    {t.status}
                  </span>
                </td>
                <td className="px-4 py-3">{t.status === "PENDING" ? <ResolveButton transactionId={t.id} /> : null}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
