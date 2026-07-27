export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { toNaira } from "@/lib/wallet";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    include: { wallet: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h1>Users</h1>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th align="left">Phone</th>
            <th align="left">Role</th>
            <th align="left">Wallet balance</th>
            <th align="left">Joined</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} style={{ borderTop: "1px solid #eee" }}>
              <td>{user.phone}</td>
              <td>{user.role}</td>
              <td>{user.wallet ? `₦${toNaira(user.wallet.balanceKobo).toLocaleString()}` : "—"}</td>
              <td>{user.createdAt.toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
