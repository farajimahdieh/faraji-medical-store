"use client";

import { ImageIcon, Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { mediaUrl, type PublicCartItem } from "@/lib/api";
import { formatToman } from "@/data/products";
import { useCart } from "./CartProvider";

export function CartItemRow({ item }: { item: PublicCartItem }) {
  const { updateQuantity, removeItem } = useCart();
  const [pending, setPending] = useState(false);
  const href = `/products/${encodeURIComponent(item.productSlug)}`;
  const atMax = item.maxQuantity !== null && item.quantity >= item.maxQuantity;

  async function changeQuantity(next: number) {
    if (next < 1 || pending) return;
    setPending(true);
    await updateQuantity(item.id, next);
    setPending(false);
  }

  async function handleRemove() {
    if (pending) return;
    setPending(true);
    const ok = await removeItem(item.id);
    if (!ok) setPending(false);
  }

  return (
    <div
      className={`flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row ${
        item.unavailable ? "border-accent-red/30 bg-tint-red/20" : "border-border bg-white"
      }`}
    >
      <Link
        href={href}
        className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-xl bg-medical-bg"
      >
        {item.primaryImage ? (
          <Image
            src={mediaUrl(item.primaryImage.url)}
            alt={item.primaryImage.altText ?? item.productName}
            fill
            sizes="112px"
            className="object-contain p-2"
          />
        ) : (
          <ImageIcon className="h-8 w-8 text-primary/40" aria-hidden="true" />
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link href={href} className="text-sm leading-6 font-bold text-navy hover:text-primary">
              {item.productName}
            </Link>
            {item.brand && <p className="mt-0.5 text-xs text-secondary-text">{item.brand.name}</p>}
            <span className="mt-1.5 inline-block rounded-md bg-medical-bg px-2 py-0.5 text-[11px] font-medium text-primary">
              سایز {item.size}
            </span>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={pending}
            aria-label={`حذف ${item.productName} از سبد خرید`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-secondary-text transition-colors hover:bg-tint-red hover:text-accent-red disabled:opacity-50"
          >
            <Trash2 className="h-4.5 w-4.5" aria-hidden="true" />
          </button>
        </div>

        {item.unavailable && item.unavailableReason && (
          <p className="text-xs font-medium text-accent-red">{item.unavailableReason}</p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 rounded-xl border border-border">
            <button
              type="button"
              onClick={() => changeQuantity(item.quantity - 1)}
              disabled={pending || item.quantity <= 1}
              aria-label="کاهش تعداد"
              className="flex h-9 w-9 items-center justify-center text-navy disabled:opacity-40"
            >
              <Minus className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="w-8 text-center text-sm font-medium text-navy">
              {item.quantity.toLocaleString("fa-IR")}
            </span>
            <button
              type="button"
              onClick={() => changeQuantity(item.quantity + 1)}
              disabled={pending || atMax}
              aria-label="افزایش تعداد"
              className="flex h-9 w-9 items-center justify-center text-navy disabled:opacity-40"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <span className="text-sm font-bold text-navy">
            {item.lineTotal !== null ? formatToman(item.lineTotal) : "قیمت پس از اتصال به سیستم فروش"}
          </span>
        </div>
      </div>
    </div>
  );
}
