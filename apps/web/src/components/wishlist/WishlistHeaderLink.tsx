"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type FocusEvent } from "react";
import { useWishlist } from "./WishlistProvider";

export function WishlistHeaderLink() {
  const { status, count } = useWishlist();
  const [open, setOpen] = useState(false);
  // Real hover-capable pointers only — guards against a touchscreen firing a
  // stray synthetic `mouseenter` on tap, which would otherwise pop the
  // popover open right before the tap's own navigation fires. Computed once
  // lazily (never affects rendered markup, so there's no SSR/hydration
  // mismatch to worry about) rather than via an effect.
  const [hoverCapable] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches,
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && open) {
        setOpen(false);
        linkRef.current?.focus();
      }
    }
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  function scheduleClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    // Long enough to move the pointer from the heart into the popover
    // below it without it vanishing mid-move, short enough not to linger.
    closeTimer.current = setTimeout(() => setOpen(false), 200);
  }

  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }

  function handleMouseEnter() {
    if (!hoverCapable) return;
    cancelClose();
    setOpen(true);
  }

  function handleMouseLeave() {
    if (!hoverCapable) return;
    scheduleClose();
  }

  function handleFocus() {
    setOpen(true);
  }

  // Focus moving to the CTA link inside the popover keeps it open; focus
  // leaving the container entirely (Tab past it, Shift+Tab away) closes it.
  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    const next = event.relatedTarget as Node | null;
    if (!next || !containerRef.current?.contains(next)) {
      setOpen(false);
    }
  }

  const showBadge = status === "ready" && count > 0;

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      <Link
        ref={linkRef}
        href="/wishlist"
        aria-label="علاقه‌مندی‌ها"
        aria-haspopup="dialog"
        aria-expanded={open}
        className="relative flex h-11 w-11 items-center justify-center rounded-xl text-navy transition-colors hover:bg-medical-bg focus-visible:bg-medical-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary hover:text-primary"
      >
        <Heart className="h-5 w-5" aria-hidden="true" />
        {showBadge && (
          <span className="absolute top-1 left-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-accent-red px-1 text-[10px] font-semibold text-white">
            {count}
          </span>
        )}
      </Link>

      {open && (
        <div
          role="dialog"
          aria-label="پیش‌نمایش علاقه‌مندی‌ها"
          className="absolute top-full left-0 z-40 mt-2 hidden w-72 rounded-2xl border border-border bg-white p-4 shadow-xl lg:block"
          onMouseEnter={cancelClose}
          onMouseLeave={handleMouseLeave}
        >
          <p className="text-sm font-bold text-navy">برای بعد نگهش دار</p>
          <p className="mt-1.5 text-xs leading-6 text-secondary-text">
            محصولاتی که هنوز برای خریدشان مطمئن نیستید اینجا ذخیره کنید؛ بعداً
            می‌توانید دوباره بررسی‌شان کنید یا درباره‌شان با پزشک مشورت کنید.
          </p>
          {status === "ready" && count > 0 ? (
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-secondary-text">
                {count.toLocaleString("fa-IR")} محصول ذخیره‌شده
              </span>
              <Link
                href="/wishlist"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 items-center justify-center rounded-xl bg-primary px-4 text-xs font-semibold text-white transition-colors hover:bg-primary-dark"
              >
                مشاهده علاقه‌مندی‌ها
              </Link>
            </div>
          ) : (
            <p className="mt-3 text-xs font-medium text-secondary-text">
              هنوز محصولی ذخیره نکرده‌اید
            </p>
          )}
        </div>
      )}
    </div>
  );
}
