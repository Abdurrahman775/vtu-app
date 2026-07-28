export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { toKobo, toNaira } from "@/lib/wallet";
import { TransactionType, TransactionStatus } from "@prisma/client";

const PURCHASE_TYPES: TransactionType[] = ["AIRTIME", "DATA", "CABLE_TV"];

async function getMarginRevenueNaira() {
  const purchases = await prisma.transaction.findMany({
    where: { status: "SUCCESS", type: { in: PURCHASE_TYPES } },
    select: { amountKobo: true, meta: true },
  });

  let totalKobo = 0n;
  for (const t of purchases) {
    const meta = t.meta as { baseAmountNaira?: number } | null;
    if (typeof meta?.baseAmountNaira === "number") {
      totalKobo += t.amountKobo - toKobo(meta.baseAmountNaira);
    }
  }
  return toNaira(totalKobo);
}

export default async function AdminOverviewPage() {
  const [userCount, walletSum, statusCounts, recentTransactions, marginRevenueNaira, openReportCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.wallet.aggregate({ _sum: { balanceKobo: true } }),
      prisma.transaction.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.transaction.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { user: true },
      }),
      getMarginRevenueNaira(),
      prisma.transactionReport.count({ where: { status: "OPEN" } }),
    ]);

  const countByStatus = Object.fromEntries(
    statusCounts.map((s) => [s.status, s._count._all]),
  ) as Record<TransactionStatus, number | undefined>;
  const pendingCount = countByStatus.PENDING ?? 0;
  const totalTransactions = statusCounts.reduce((sum, s) => sum + s._count._all, 0);

  const stats = [
    { label: "Total users", value: userCount.toLocaleString() },
    {
      label: "Total wallet balance",
      value: `₦${toNaira(walletSum._sum.balanceKobo ?? 0n).toLocaleString()}`,
    },
    { label: "Margin revenue (all time)", value: `₦${marginRevenueNaira.toLocaleString()}` },
    { label: "Total transactions", value: totalTransactions.toLocaleString() },
  ];

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-slate-900">Dashboard</h1>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-slate-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {pendingCount > 0 && (
        <Link
          href="/admin/transactions"
          className="mb-4 block rounded-xl bg-amber-50 p-4 text-sm font-medium text-amber-800 hover:bg-amber-100"
        >
          {pendingCount} transaction{pendingCount === 1 ? "" : "s"} pending manual resolution →
        </Link>
      )}

      {openReportCount > 0 && (
        <Link
          href="/admin/reports"
          className="mb-8 block rounded-xl bg-red-50 p-4 text-sm font-medium text-red-800 hover:bg-red-100"
        >
          {openReportCount} unresolved user report{openReportCount === 1 ? "" : "s"} →
        </Link>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Recent activity</h2>
          <ul className="divide-y divide-slate-100">
            {recentTransactions.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-medium text-slate-900">{t.type} — {t.provider}</p>
                  <p className="text-xs text-slate-500">{t.user.phone}</p>
                </div>
                <p className="text-slate-700">₦{toNaira(t.amountKobo).toLocaleString()}</p>
              </li>
            ))}
            {recentTransactions.length === 0 && (
              <li className="py-2 text-sm text-slate-500">No transactions yet</li>
            )}
          </ul>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Quick links</h2>
          <div className="flex flex-col gap-2">
            <Link href="/admin/transactions" className="rounded-lg px-3 py-2 text-sm text-blue-700 hover:bg-blue-50">
              View all transactions
            </Link>
            <Link href="/admin/users" className="rounded-lg px-3 py-2 text-sm text-blue-700 hover:bg-blue-50">
              Manage users
            </Link>
            <Link href="/admin/pricing" className="rounded-lg px-3 py-2 text-sm text-blue-700 hover:bg-blue-50">
              Adjust pricing & margins
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
