"use client";

import { Heart, Loader2 } from "lucide-react";
import { useState, type MouseEvent } from "react";
import { useToast } from "@/components/toast/ToastProvider";
import { useWishlist } from "./WishlistProvider";

interface WishlistButtonProps {
  productId: string;
  variantId?: string | null;
  productName: string;
  /** "icon": bare heart for cards/galleries. "labeled": heart + text for the detail page. */
  variant?: "icon" | "labeled";
  className?: string;
}

export function WishlistButton({
  productId,
  variantId,
  productName,
  variant = "icon",
  className = "",
}: WishlistButtonProps) {
  const { status, isSaved, toggle } = useWishlist();
  const { showToast } = useToast();
  const [pending, setPending] = useState(false);
  const saved = isSaved(productId, variantId);

  async function handleClick(event: MouseEvent) {
    // Product cards wrap their image in a <Link>; this button sits as a
    // sibling over it, but stopPropagation stays cheap insurance against a
    // future layout change nesting it inside the link.
    event.preventDefault();
    event.stopPropagation();
    if (pending || status === "loading") return;

    if (status === "anonymous") {
      showToast("برای ذخیره علاقه‌مندی‌ها وارد حساب کاربری شوید.", {
        variant: "info",
        duration: 5000,
        action: { label: "ورود به حساب", href: "/login" },
      });
      return;
    }

    setPending(true);
    await toggle({ productId, variantId });
    setPending(false);
  }

  const label = saved
    ? `حذف ${productName} از علاقه‌مندی‌ها`
    : `افزودن ${productName} به علاقه‌مندی‌ها`;

  const icon = pending ? (
    <Loader2 className="h-4.5 w-4.5 animate-spin" aria-hidden="true" />
  ) : (
    <Heart
      className={`h-4.5 w-4.5 transition-transform duration-150 ${
        saved ? "scale-105 fill-accent-red text-accent-red" : ""
      }`}
      aria-hidden="true"
    />
  );

  if (variant === "labeled") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-pressed={saved}
        aria-label={label}
        className={`flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors active:scale-95 disabled:opacity-60 disabled:active:scale-100 ${
          saved
            ? "border-accent-red/25 bg-tint-red text-accent-red"
            : "border-border text-navy hover:border-accent-red/40 hover:text-accent-red"
        } ${className}`}
      >
        {icon}
        {saved ? "ذخیره شده" : "ذخیره برای بعد"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={saved}
      aria-label={label}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-secondary-text shadow-sm backdrop-blur transition-colors active:scale-90 hover:text-accent-red disabled:opacity-60 disabled:active:scale-100 ${
        saved ? "text-accent-red" : ""
      } ${className}`}
    >
      {icon}
    </button>
  );
}
