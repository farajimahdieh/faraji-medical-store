"use client";

import { useState } from "react";
import { SizeSelector, hasSelectableSizes } from "./SizeSelector";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import type { PublicProductVariant } from "@/lib/api";

interface ProductVariantWishlistProps {
  productId: string;
  productName: string;
  variants: PublicProductVariant[];
}

// Lifts the selected-size state above SizeSelector so the wishlist button
// can save the exact variant the shopper has highlighted — but only when
// that selection is a real choice (see hasSelectableSizes); a single
// "one size" variant is saved at the product level, same as no selection.
export function ProductVariantWishlist({
  productId,
  productName,
  variants,
}: ProductVariantWishlistProps) {
  const [selectedId, setSelectedId] = useState(variants[0]?.id);
  const variantId = hasSelectableSizes(variants) ? selectedId : undefined;

  return (
    <div className="flex flex-col gap-3">
      <SizeSelector variants={variants} selectedId={selectedId} onSelect={setSelectedId} />
      <WishlistButton
        productId={productId}
        variantId={variantId}
        productName={productName}
        variant="labeled"
      />
    </div>
  );
}
