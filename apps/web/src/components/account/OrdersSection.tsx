"use client";

import { Package } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useOrders } from "./useOrders";
import { OrderCard } from "./OrderCard";

export function OrdersSection() {
  const { status, orders, reload } = useOrders();

  return (
    <div className="rounded-[24px] border border-border bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-lg font-bold text-navy">سفارش‌های من</h2>

      <div className="mt-6">
        {status === "loading" && <OrdersSkeleton />}

        {status === "error" && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-white py-16 text-center">
            <p className="text-sm text-accent-red">دریافت اطلاعات انجام نشد. دوباره تلاش کنید.</p>
            <Button variant="outline" onClick={reload}>
              تلاش دوباره
            </Button>
          </div>
        )}

        {status === "ready" && orders.length === 0 && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-white py-16 text-center">
            <Package className="h-10 w-10 text-secondary-text" aria-hidden="true" />
            <div>
              <p className="text-sm font-bold text-navy">هنوز سفارشی ثبت نکرده‌اید</p>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-secondary-text">
                بعد از تکمیل خرید، سفارش‌هایتان اینجا نمایش داده می‌شوند.
              </p>
            </div>
            <Link
              href="/products"
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              مشاهده محصولات
            </Link>
          </div>
        )}

        {status === "ready" && orders.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OrdersSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2" aria-hidden="true">
      {[0, 1].map((row) => (
        <div key={row} className="flex animate-pulse flex-col gap-3 rounded-2xl border border-border bg-white p-5">
          <div className="h-4 w-1/3 rounded bg-medical-bg" />
          <div className="h-3 w-2/3 rounded bg-medical-bg" />
          <div className="h-4 w-1/2 rounded bg-medical-bg" />
        </div>
      ))}
    </div>
  );
}
