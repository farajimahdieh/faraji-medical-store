"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { listAdminProducts, listAdminOrders } from "@/lib/admin-api";

export default function AdminDashboardPage() {
  const [productCount, setProductCount] = useState<number | null>(null);
  const [orderCount, setOrderCount] = useState<number | null>(null);

  useEffect(() => {
    listAdminProducts({ limit: 1 }).then((res) => setProductCount(res.total));
    listAdminOrders({ limit: 1 }).then((res) => setOrderCount(res.total));
  }, []);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-navy">داشبورد</h1>
        <Link href="/admin/products/new">
          <Button>اضافه کردن محصول جدید</Button>
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/admin/products"
          className="rounded-2xl border border-border bg-white p-6 transition-colors hover:border-primary"
        >
          <div className="text-sm text-secondary-text">تعداد محصولات</div>
          <div className="mt-2 text-3xl font-bold text-navy">{productCount ?? "..."}</div>
        </Link>
        <Link
          href="/admin/orders"
          className="rounded-2xl border border-border bg-white p-6 transition-colors hover:border-primary"
        >
          <div className="text-sm text-secondary-text">تعداد سفارش‌ها</div>
          <div className="mt-2 text-3xl font-bold text-navy">{orderCount ?? "..."}</div>
        </Link>
      </div>
    </div>
  );
}
