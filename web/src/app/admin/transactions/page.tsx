export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { toNaira } from "@/lib/wallet";
import { ResolveButton } from "./ResolveButton";

export default async function AdminTransactionsPage() {
  const transactions = await prisma.transaction.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h1>Transactions</h1>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th align="left">Reference</th>
            <th align="left">User</th>
            <th align="left">Type</th>
            <th align="left">Provider</th>
            <th align="left">Amount</th>
            <th align="left">Status</th>
            <th align="left">Action</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.id} style={{ borderTop: "1px solid #eee" }}>
              <td>{t.reference}</td>
              <td>{t.user.phone}</td>
              <td>{t.type}</td>
              <td>{t.provider}</td>
              <td>₦{toNaira(t.amountKobo).toLocaleString()}</td>
              <td>{t.status}</td>
              <td>{t.status === "PENDING" ? <ResolveButton transactionId={t.id} /> : null}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
