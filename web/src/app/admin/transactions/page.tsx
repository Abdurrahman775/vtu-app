export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { toNaira } from "@/lib/wallet";
import { ResolveButton } from "./ResolveButton";

const statusStyles: Record<string, string> = {
  SUCCESS: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  FAILED: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  REVERSED: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export default async function AdminTransactionsPage() {
  const transactions = await prisma.transaction.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-slate-900 dark:text-slate-100">Transactions</h1>
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800 dark:text-slate-400">
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
              <tr key={t.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">{t.reference}</td>
                <td className="px-4 py-3 text-slate-900 dark:text-slate-100">{t.user.phone}</td>
                <td className="px-4 py-3 text-slate-900 dark:text-slate-100">{t.type}</td>
                <td className="px-4 py-3 text-slate-900 dark:text-slate-100">{t.provider}</td>
                <td className="px-4 py-3 text-slate-900 dark:text-slate-100">₦{toNaira(t.amountKobo).toLocaleString()}</td>
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
