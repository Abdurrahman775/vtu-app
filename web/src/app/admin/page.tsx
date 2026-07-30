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
  const [
    userCount,
    walletSum,
    statusCounts,
    recentTransactions,
    marginRevenueNaira,
    openReportCount,
    pendingVerificationCount,
  ] = await Promise.all([
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
    prisma.verificationRequest.count({ where: { status: "PENDING" } }),
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
      <h1 className="mb-6 text-xl font-semibold text-slate-900 dark:text-slate-100">Dashboard</h1>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl bg-white p-5 shadow-sm dark:bg-slate-900">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{stat.value}</p>
          </div>
        ))}
      </div>

      {pendingCount > 0 && (
        <Link
          href="/admin/transactions"
          className="mb-4 block rounded-xl bg-amber-50 p-4 text-sm font-medium text-amber-800 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300 dark:hover:bg-amber-900"
        >
          {pendingCount} transaction{pendingCount === 1 ? "" : "s"} pending manual resolution →
        </Link>
      )}

      {openReportCount > 0 && (
        <Link
          href="/admin/reports"
          className="mb-4 block rounded-xl bg-red-50 p-4 text-sm font-medium text-red-800 hover:bg-red-100 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900"
        >
          {openReportCount} unresolved user report{openReportCount === 1 ? "" : "s"} →
        </Link>
      )}

      {pendingVerificationCount > 0 && (
        <Link
          href="/admin/verification"
          className="mb-8 block rounded-xl bg-blue-50 p-4 text-sm font-medium text-blue-800 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900"
        >
          {pendingVerificationCount} verification request{pendingVerificationCount === 1 ? "" : "s"} awaiting review →
        </Link>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-slate-900">
          <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">Recent activity</h2>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentTransactions.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{t.type} — {t.provider}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t.user.phone}</p>
                </div>
                <p className="text-slate-700 dark:text-slate-300">₦{toNaira(t.amountKobo).toLocaleString()}</p>
              </li>
            ))}
            {recentTransactions.length === 0 && (
              <li className="py-2 text-sm text-slate-500 dark:text-slate-400">No transactions yet</li>
            )}
          </ul>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-slate-900">
          <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">Quick links</h2>
          <div className="flex flex-col gap-2">
            <Link href="/admin/transactions" className="rounded-lg px-3 py-2 text-sm text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950">
              View all transactions
            </Link>
            <Link href="/admin/users" className="rounded-lg px-3 py-2 text-sm text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950">
              Manage users
            </Link>
            <Link href="/admin/pricing" className="rounded-lg px-3 py-2 text-sm text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950">
              Adjust pricing & margins
            </Link>
            <Link href="/admin/verification" className="rounded-lg px-3 py-2 text-sm text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950">
              Review verification requests
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
