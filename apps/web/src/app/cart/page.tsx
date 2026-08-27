"use client";

import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { useCart } from "@/components/cart/CartProvider";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { CartLoginPrompt } from "@/components/cart/CartLoginPrompt";
import { CartEmptyState } from "@/components/cart/CartEmptyState";
import { CouponInput } from "@/components/cart/CouponInput";
import { CartSummary } from "@/components/cart/CartSummary";

export default function CartPage() {
  const { status, items, summary, clearCart } = useCart();

  if (status === "loading") {
    return (
      <p className="px-6 py-24 text-center text-sm text-secondary-text">در حال بارگذاری...</p>
    );
  }

  if (status === "anonymous") {
    return (
      <Container className="py-10">
        <h1 className="text-2xl font-bold text-navy">سبد خرید</h1>
        <CartLoginPrompt />
      </Container>
    );
  }

  if (items.length === 0) {
    return (
      <Container className="py-10">
        <h1 className="text-2xl font-bold text-navy">سبد خرید</h1>
        <CartEmptyState />
      </Container>
    );
  }

  const hasUnavailable = items.some((item) => item.unavailable);

  return (
    <Container className="py-10">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-navy">سبد خرید</h1>
        <button
          type="button"
          onClick={() => clearCart()}
          className="text-xs font-medium text-accent-red hover:underline"
        >
          پاک کردن سبد
        </button>
      </div>

      <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {items.map((item) => (
            <CartItemRow key={item.id} item={item} />
          ))}
        </div>

        <div className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0">
          <div className="rounded-2xl border border-border bg-white p-5">
            <h2 className="mb-3 text-sm font-bold text-navy">کد تخفیف</h2>
            <CouponInput />
          </div>

          <CartSummary summary={summary} />

          {hasUnavailable ? (
            <p className="text-center text-xs font-medium text-accent-red">
              برای ادامه، کالاهای ناموجود را از سبد خرید حذف کنید.
            </p>
          ) : (
            <Link
              href="/checkout"
              className="flex h-12 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              ادامه به تسویه‌حساب
            </Link>
          )}
        </div>
      </div>
    </Container>
  );
}
