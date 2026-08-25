"use client";

import { User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useWishlist } from "@/components/wishlist/WishlistProvider";
import { loginHrefWithReturnTo } from "@/lib/return-to";
import { HEADER_POPOVER_PANEL_CLASSNAME, useHeaderPopover } from "./useHeaderPopover";

export function ProfilePopover() {
  const { status, user, logout } = useAuth();
  const { reset: resetWishlist } = useWishlist();
  const router = useRouter();
  const { open, containerRef, triggerRef, containerProps, triggerAriaProps, panelProps } =
    useHeaderPopover();

  async function handleLogout() {
    await logout();
    resetWishlist();
    router.push("/login");
  }

  const directHref = status === "authenticated" ? "/account" : loginHrefWithReturnTo("/account");

  return (
    <div ref={containerRef} className="relative" {...containerProps}>
      <Link
        ref={triggerRef}
        href={directHref}
        aria-label="حساب کاربری"
        className="relative flex h-11 w-11 items-center justify-center rounded-xl text-navy transition-colors hover:bg-medical-bg hover:text-primary focus-visible:bg-medical-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        {...triggerAriaProps}
      >
        <UserIcon className="h-5 w-5" aria-hidden="true" />
      </Link>

      {open && (
        <div
          role="dialog"
          aria-label="پیش‌نمایش حساب کاربری"
          className={HEADER_POPOVER_PANEL_CLASSNAME}
          {...panelProps}
        >
          {status === "authenticated" && user ? (
            <>
              <p className="text-sm font-bold text-navy">سلام، {user.firstName ?? "کاربر"} جان</p>
              <div className="mt-3 flex flex-col gap-1">
                <Link
                  href="/account"
                  className="rounded-lg px-2 py-1.5 text-sm text-navy transition-colors hover:bg-medical-bg"
                >
                  حساب کاربری
                </Link>
                <Link
                  href="/account?section=addresses"
                  className="rounded-lg px-2 py-1.5 text-sm text-navy transition-colors hover:bg-medical-bg"
                >
                  آدرس‌های من
                </Link>
                <Link
                  href="/wishlist"
                  className="rounded-lg px-2 py-1.5 text-sm text-navy transition-colors hover:bg-medical-bg"
                >
                  علاقه‌مندی‌ها
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-1 rounded-lg px-2 py-1.5 text-right text-sm text-accent-red transition-colors hover:bg-accent-red/5"
                >
                  خروج
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-navy">حساب کاربری</p>
              <p className="mt-1.5 text-xs leading-6 text-secondary-text">
                برای مدیریت اطلاعات، آدرس‌ها و علاقه‌مندی‌ها وارد حساب شوید.
              </p>
              <Link
                href={loginHrefWithReturnTo("/account")}
                className="mt-3 inline-flex h-9 items-center justify-center rounded-xl bg-primary px-4 text-xs font-semibold text-white transition-colors hover:bg-primary-dark"
              >
                ورود / ثبت‌نام
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
