"use client";

import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { formatToman } from "@/data/products";
import { HEADER_POPOVER_PANEL_CLASSNAME, useHeaderPopover } from "./useHeaderPopover";

export function CartPopover() {
  const { open, containerRef, triggerRef, containerProps, triggerAriaProps, panelProps } =
    useHeaderPopover();
  const { status, items, count, summary } = useCart();
  const showBadge = status === "ready" && count > 0;

  return (
    <div ref={containerRef} className="relative" {...containerProps}>
      <Link
        ref={triggerRef}
        href="/cart"
        aria-label="سبد خرید"
        className="relative flex h-11 w-11 items-center justify-center rounded-xl text-navy transition-colors hover:bg-medical-bg hover:text-primary focus-visible:bg-medical-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        {...triggerAriaProps}
      >
        <ShoppingCart className="h-5 w-5" aria-hidden="true" />
        {showBadge && (
          <span className="absolute top-1 left-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
            {count.toLocaleString("fa-IR")}
          </span>
        )}
      </Link>

      {open && (
        <div
          role="dialog"
          aria-label="پیش‌نمایش سبد خرید"
          className={HEADER_POPOVER_PANEL_CLASSNAME}
          {...panelProps}
        >
          <p className="text-sm font-bold text-navy">سبد خرید شما</p>

          {(status !== "ready" || count === 0) && (
            <p className="mt-1.5 text-xs leading-6 text-secondary-text">
              محصولاتی که برای خرید انتخاب می‌کنید اینجا نگه داشته می‌شوند.
            </p>
          )}

          {status === "ready" && count > 0 && (
            <>
              <ul className="mt-3 flex flex-col gap-2">
                {items.slice(0, 3).map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-2 text-xs">
                    <span className="min-w-0 truncate text-navy">{item.productName}</span>
                    <span className="shrink-0 text-secondary-text">{item.quantity.toLocaleString("fa-IR")}×</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
                <span className="text-xs font-medium text-secondary-text">جمع کل</span>
                <span className="text-sm font-bold text-navy">{formatToman(summary.totalAmount)}</span>
              </div>
              <Link
                href="/cart"
                className="mt-3 flex h-9 items-center justify-center rounded-xl bg-primary text-xs font-semibold text-white transition-colors hover:bg-primary-dark"
              >
                مشاهده سبد خرید
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
