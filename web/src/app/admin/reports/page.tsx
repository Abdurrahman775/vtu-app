export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { toNaira } from "@/lib/wallet";
import { ResolveReportButton } from "./ResolveReportButton";

export default async function AdminReportsPage() {
  const reports = await prisma.transactionReport.findMany({
    include: { transaction: true, user: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-slate-900 dark:text-slate-100">Transaction Reports</h1>
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Transaction</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Reason</th>
              <th className="px-4 py-3 font-medium">Message</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                <td className="px-4 py-3 text-slate-900 dark:text-slate-100">{r.user.email}</td>
                <td className="px-4 py-3 text-slate-900 dark:text-slate-100">
                  {r.transaction.type} — {r.transaction.provider}
                </td>
                <td className="px-4 py-3 text-slate-900 dark:text-slate-100">
                  ₦{toNaira(r.transaction.amountKobo).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-slate-900 dark:text-slate-100">{r.reason}</td>
                <td className="px-4 py-3 max-w-xs truncate text-slate-700 dark:text-slate-300">{r.message ?? "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      r.status === "OPEN"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                        : "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {r.status === "OPEN" ? <ResolveReportButton reportId={r.id} /> : null}
                </td>
              </tr>
            ))}
            {reports.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                  No reports yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
