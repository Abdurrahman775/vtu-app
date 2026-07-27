"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin/transactions", label: "Transactions" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/pricing", label: "Pricing" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin/login")) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <nav className="w-56 shrink-0 bg-gradient-to-b from-blue-950 to-blue-800 text-white p-6">
        <h2 className="text-lg font-semibold mb-8">VTU Admin</h2>
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block rounded-lg px-3 py-2 text-sm text-blue-100 hover:bg-white/10 hover:text-white transition-colors"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
