"use client";

import { Copy, Tag } from "lucide-react";
import { useToast } from "@/components/toast/ToastProvider";
import { formatToman } from "@/data/products";
import type { PublicDiscountCode } from "@/lib/api";

function formatCouponValue(coupon: PublicDiscountCode): string {
  return coupon.type === "percentage"
    ? `${coupon.value.toLocaleString("fa-IR")}% تخفیف`
    : formatToman(coupon.value);
}

function formatExpiry(expiresAt: string): string {
  return new Date(expiresAt).toLocaleDateString("fa-IR");
}

export function CouponCard({ coupon }: { coupon: PublicDiscountCode }) {
  const { showToast } = useToast();

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(coupon.code);
      showToast("کد تخفیف کپی شد", { variant: "success" });
    } catch {
      showToast("کپی کد انجام نشد", { variant: "error" });
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-primary/30 bg-tint-blue p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Tag className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span dir="ltr" className="truncate font-mono text-base font-bold tracking-wider text-navy">
            {coupon.code}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-primary/30 bg-white px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-white"
        >
          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          کپی کد
        </button>
      </div>

      <p className="text-sm font-bold text-navy">{formatCouponValue(coupon)}</p>

      {(coupon.expiresAt || coupon.minimumOrderAmount != null) && (
        <dl className="flex flex-col gap-1 text-xs text-secondary-text">
          {coupon.expiresAt && (
            <div className="flex justify-between gap-2">
              <dt>تاریخ انقضا</dt>
              <dd>{formatExpiry(coupon.expiresAt)}</dd>
            </div>
          )}
          {coupon.minimumOrderAmount != null && (
            <div className="flex justify-between gap-2">
              <dt>حداقل مبلغ سفارش</dt>
              <dd>{formatToman(coupon.minimumOrderAmount)}</dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}
