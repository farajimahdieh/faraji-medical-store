"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { listCoupons, type AdminCoupon } from "@/lib/admin-api";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);

  useEffect(() => {
    listCoupons().then(setCoupons);
  }, []);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-navy">کوپن‌ها ({coupons.length})</h1>
        <Link href="/admin/coupons/new">
          <Button>+ کوپن جدید</Button>
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-white">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b border-border text-right text-secondary-text">
              <th className="p-3 font-medium">کد</th>
              <th className="p-3 font-medium">نوع</th>
              <th className="p-3 font-medium">مقدار</th>
              <th className="p-3 font-medium">مخاطب</th>
              <th className="p-3 font-medium">وضعیت</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((coupon) => (
              <tr key={coupon.id} className="border-b border-border last:border-0 hover:bg-medical-bg/40">
                <td className="p-3">
                  <Link href={`/admin/coupons/${coupon.id}`} className="font-medium text-primary hover:underline">
                    {coupon.code}
                  </Link>
                </td>
                <td className="p-3 text-navy">{coupon.type === "percentage" ? "درصدی" : "مبلغ ثابت"}</td>
                <td className="p-3 text-navy">
                  {coupon.value.toLocaleString("fa-IR")}
                  {coupon.type === "percentage" ? "%" : " تومان"}
                </td>
                <td className="p-3 text-navy">{AUDIENCE_LABELS[coupon.audienceType]}</td>
                <td className="p-3">{coupon.isActive ? "فعال" : "غیرفعال"}</td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-secondary-text">
                  کوپنی یافت نشد
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const AUDIENCE_LABELS: Record<AdminCoupon["audienceType"], string> = {
  all: "همه کاربران",
  specific_users: "کاربران مشخص",
  no_orders_ever: "بدون خرید",
  no_orders_in_months: "بدون خرید اخیر",
  min_orders: "حداقل تعداد سفارش",
  min_spend: "حداقل مبلغ خرید",
};
