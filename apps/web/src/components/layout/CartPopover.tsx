"use client";

import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { HEADER_POPOVER_PANEL_CLASSNAME, useHeaderPopover } from "./useHeaderPopover";

// No real cart exists yet (no backend entity, no frontend state) -- this
// intentionally always renders the honest empty state rather than fabricate
// items or a count. When a real cart is built, this is the one place to
// wire in actual data.
export function CartPopover() {
  const { open, containerRef, triggerRef, containerProps, triggerAriaProps, panelProps } =
    useHeaderPopover();

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
      </Link>

      {open && (
        <div
          role="dialog"
          aria-label="پیش‌نمایش سبد خرید"
          className={HEADER_POPOVER_PANEL_CLASSNAME}
          {...panelProps}
        >
          <p className="text-sm font-bold text-navy">سبد خرید شما</p>
          <p className="mt-1.5 text-xs leading-6 text-secondary-text">
            محصولاتی که برای خرید انتخاب می‌کنید اینجا نگه داشته می‌شوند.
          </p>
        </div>
      )}
    </div>
  );
}
