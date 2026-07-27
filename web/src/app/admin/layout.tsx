import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <nav style={{ width: 200, borderRight: "1px solid #ddd", padding: 16 }}>
        <h2>VTU Admin</h2>
        <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          <li><Link href="/admin/transactions">Transactions</Link></li>
          <li><Link href="/admin/users">Users</Link></li>
          <li><Link href="/admin/pricing">Pricing</Link></li>
        </ul>
      </nav>
      <main style={{ flex: 1, padding: 24 }}>{children}</main>
    </div>
  );
}
