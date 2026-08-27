"use client";

import { X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useCart } from "./CartProvider";

export function CouponInput() {
  const { coupon, couponError, applyCoupon, removeCoupon } = useCart();
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);

  async function handleApply(event: FormEvent) {
    event.preventDefault();
    if (!code.trim() || pending) return;
    setPending(true);
    const ok = await applyCoupon(code.trim());
    if (ok) setCode("");
    setPending(false);
  }

  async function handleRemove() {
    if (pending) return;
    setPending(true);
    await removeCoupon();
    setPending(false);
  }

  if (coupon) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-xl bg-tint-blue px-4 py-3">
        <span className="text-sm font-medium text-primary">کد «{coupon.code}» اعمال شد</span>
        <button
          type="button"
          onClick={handleRemove}
          disabled={pending}
          aria-label="حذف کد تخفیف"
          className="text-secondary-text transition-colors hover:text-accent-red disabled:opacity-50"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleApply} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="کد تخفیف را وارد کنید"
          className="h-11 flex-1 rounded-xl border border-border px-3 text-sm focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending || !code.trim()}
          className="h-11 shrink-0 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
        >
          اعمال
        </button>
      </div>
      {couponError && <p className="text-xs font-medium text-accent-red">{couponError}</p>}
    </form>
  );
}
