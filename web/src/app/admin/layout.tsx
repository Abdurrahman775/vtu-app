"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/transactions", label: "Transactions" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/verification", label: "Verification" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/pricing", label: "Pricing" },
];

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <ul className="flex flex-col gap-1">
      {navItems.map((item) => {
        const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive ? "bg-white/15 text-white" : "text-blue-100 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (pathname.startsWith("/admin/login")) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <nav className="hidden w-56 shrink-0 flex-col bg-gradient-to-b from-blue-950 to-blue-800 p-6 text-white lg:flex">
        <h2 className="mb-8 text-lg font-semibold">VTU Admin</h2>
        <NavLinks pathname={pathname} />
      </nav>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <nav className="absolute inset-y-0 left-0 w-64 bg-gradient-to-b from-blue-950 to-blue-800 p-6 text-white shadow-xl">
            <h2 className="mb-8 text-lg font-semibold">VTU Admin</h2>
            <NavLinks pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
          </nav>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-slate-900">VTU Admin</span>
        </header>

        <main className="flex-1 overflow-x-hidden p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
