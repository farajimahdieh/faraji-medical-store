"use client";

import { Heart, ImageIcon, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { formatToman, type Product } from "@/data/products";

export function ProductCard({ product }: { product: Product }) {
  const [wishlisted, setWishlisted] = useState(false);

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-white transition-shadow hover:shadow-md">
      <div className="relative">
        <Link
          href={`/products/${product.slug}`}
          className="flex aspect-square items-center justify-center bg-medical-bg"
        >
          <ImageIcon className="h-10 w-10 text-primary/40" aria-hidden="true" />
        </Link>
        <button
          type="button"
          onClick={() => setWishlisted((v) => !v)}
          aria-pressed={wishlisted}
          aria-label="افزودن به علاقه‌مندی‌ها"
          className="absolute top-3 left-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-secondary-text shadow-sm transition-colors hover:text-accent-red"
        >
          <Heart className={`h-4.5 w-4.5 ${wishlisted ? "fill-accent-red text-accent-red" : ""}`} aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-sm leading-6 font-bold text-navy">{product.name}</h3>
        </Link>
        <p className="text-xs text-secondary-text">{product.brand}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-sm font-bold text-navy">{formatToman(product.price)}</span>
          <button
            type="button"
            aria-label="افزودن به سبد خرید"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-medical-bg text-primary transition-colors hover:bg-primary hover:text-white"
          >
            <ShoppingCart className="h-4.5 w-4.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
