"use client";

import { ImageIcon, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { mediaUrl, type PublicWishlistItem } from "@/lib/api";
import { formatPriceDisplay, formatStockStatus } from "@/lib/catalog-format";
import { useWishlist } from "./WishlistProvider";
import { WishlistNoteEditor } from "./WishlistNoteEditor";

const stockToneClass: Record<"positive" | "negative" | "neutral", string> = {
  positive: "text-primary",
  negative: "text-accent-red",
  neutral: "text-secondary-text",
};

interface WishlistItemCardProps {
  item: PublicWishlistItem;
}

export function WishlistItemCard({ item }: WishlistItemCardProps) {
  const { removeItem, updateItemNote } = useWishlist();
  const [removing, setRemoving] = useState(false);
  // The backend never returns a wishlist item for a fully deleted product
  // (the row cascades away with it) — but it also has no "hidden/archived"
  // flag on this endpoint yet, so a genuinely unavailable product still
  // renders with its real name/image here. Rather than fake a detector,
  // this just makes sure nothing throws if a field ever comes back empty;
  // the product link itself already 404s safely if it's since gone hidden.
  const displayName = item.productName || "محصول";
  const href = item.productSlug ? `/products/${encodeURIComponent(item.productSlug)}` : null;
  const stock = formatStockStatus(item.stockStatus);
  const priceLabel = formatPriceDisplay(item.price);
  const priceAvailable = item.price.status === "available";

  async function handleRemove() {
    if (removing) return;
    setRemoving(true);
    const ok = await removeItem(item.wishlistItemId);
    // On success the item disappears from the shared `items` list this card
    // is rendered from, unmounting it — no local "removed" state needed. On
    // failure, un-disable so the user can try again.
    if (!ok) setRemoving(false);
  }

  const image = item.primaryImage ? (
    <Image
      src={mediaUrl(item.primaryImage.url)}
      alt={item.primaryImage.altText ?? displayName}
      fill
      sizes="112px"
      className="object-contain p-2"
    />
  ) : (
    <ImageIcon className="h-8 w-8 text-primary/40" aria-hidden="true" />
  );

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-4 sm:flex-row">
      {href ? (
        <Link
          href={href}
          className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-xl bg-medical-bg"
        >
          {image}
        </Link>
      ) : (
        <div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-xl bg-medical-bg">
          {image}
        </div>
      )}

      <div className="flex flex-1 flex-col gap-2.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            {href ? (
              <Link href={href} className="text-sm leading-6 font-bold text-navy hover:text-primary">
                {displayName}
              </Link>
            ) : (
              <p className="text-sm leading-6 font-bold text-navy">{displayName}</p>
            )}
            {item.brand && <p className="mt-0.5 text-xs text-secondary-text">{item.brand.name}</p>}
            {item.size && (
              <span className="mt-1.5 inline-block rounded-md bg-medical-bg px-2 py-0.5 text-[11px] font-medium text-primary">
                سایز {item.size}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={removing}
            aria-label={`حذف ${displayName} از علاقه‌مندی‌ها`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-secondary-text transition-colors hover:bg-tint-red hover:text-accent-red disabled:opacity-50"
          >
            <Trash2 className="h-4.5 w-4.5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span
            className={priceAvailable ? "text-sm font-bold text-navy" : "text-xs font-medium text-secondary-text"}
          >
            {priceLabel}
          </span>
          <span className={`text-xs font-medium ${stockToneClass[stock.tone]}`}>{stock.label}</span>
        </div>

        <WishlistNoteEditor
          wishlistItemId={item.wishlistItemId}
          note={item.note}
          onChange={(note) => updateItemNote(item.wishlistItemId, note)}
        />
      </div>
    </div>
  );
}
