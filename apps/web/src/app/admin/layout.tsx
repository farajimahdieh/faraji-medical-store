"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { RequireRole } from "@/components/admin/RequireRole";
import { useAuth } from "@/components/auth/AuthProvider";

const NAV_ITEMS = [
  { href: "/admin", label: "داشبورد" },
  { href: "/admin/products", label: "محصولات" },
  { href: "/admin/products/pending", label: "محصولات در انتظار بررسی" },
  { href: "/admin/orders", label: "سفارش‌ها" },
  { href: "/admin/coupons", label: "کوپن‌ها" },
  { href: "/admin/content", label: "محتوا" },
];

const PUBLIC_ADMIN_ROUTES = ["/admin/login", "/admin/activate"];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname && PUBLIC_ADMIN_ROUTES.includes(pathname)) {
    return <>{children}</>;
  }

  return (
    <RequireRole role="admin">
      <AdminShell pathname={pathname}>{children}</AdminShell>
    </RequireRole>
  );
}

function AdminShell({ pathname, children }: { pathname: string; children: ReactNode }) {
  const { user, logout } = useAuth();
  const navItems =
    user?.role === "super_admin"
      ? [
          ...NAV_ITEMS,
          { href: "/admin/admins", label: "مدیریت ادمین‌ها" },
          { href: "/admin/audit-logs", label: "لاگ‌های حسابرسی" },
        ]
      : NAV_ITEMS;

  return (
    <div className="flex min-h-screen flex-col bg-neutral-bg md:flex-row" dir="rtl">
      <aside className="flex shrink-0 flex-col gap-1 border-b border-border bg-white p-4 md:w-56 md:border-b-0 md:border-l">
        <div className="mb-4 px-2 text-sm font-bold text-navy">پنل مدیریت</div>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              pathname === item.href ? "bg-medical-bg text-primary" : "text-navy hover:bg-medical-bg"
            }`}
          >
            {item.label}
          </Link>
        ))}
        <button
          onClick={() => logout()}
          className="mt-4 rounded-xl px-3 py-2 text-right text-sm font-medium text-accent-red hover:bg-accent-red/5"
        >
          خروج
        </button>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
