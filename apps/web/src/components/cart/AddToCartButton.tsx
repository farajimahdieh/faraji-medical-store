"use client";

import { Loader2, ShoppingCart } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, type MouseEvent } from "react";
import { useToast } from "@/components/toast/ToastProvider";
import { currentPathWithQuery, loginHrefWithReturnTo } from "@/lib/return-to";
import { Modal } from "@/components/ui/Modal";
import { SizeSelector, hasSelectableSizes } from "@/components/catalog/SizeSelector";
import type { PublicProductVariant } from "@/lib/api";
import { useCart } from "./CartProvider";

interface AddToCartButtonProps {
  productName: string;
  /** Use when a specific variant is already chosen (e.g. the product detail page). */
  variantId?: string;
  /** Use when no variant is chosen yet (e.g. a product card) -- opens a size picker if needed. */
  variants?: PublicProductVariant[];
  className?: string;
}

export function AddToCartButton({
  productName,
  variantId,
  variants,
  className = "",
}: AddToCartButtonProps) {
  const { status, addItem } = useCart();
  const { showToast } = useToast();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [pickedVariantId, setPickedVariantId] = useState(variants?.[0]?.id);

  async function addVariant(id: string) {
    setPending(true);
    await addItem(id, 1);
    setPending(false);
  }

  async function handleClick(event: MouseEvent) {
    // Product cards wrap their image in a <Link>; this button sits as a
    // sibling, but stopPropagation stays cheap insurance against a future
    // layout change nesting it inside the link (see WishlistButton).
    event.preventDefault();
    event.stopPropagation();
    if (pending || status === "loading") return;

    if (status === "anonymous") {
      const returnTo = currentPathWithQuery(pathname, searchParams);
      showToast("برای خرید ابتدا وارد حساب کاربری شوید.", {
        variant: "info",
        duration: 5000,
        action: { label: "ورود به حساب", href: loginHrefWithReturnTo(returnTo) },
      });
      return;
    }

    if (variantId) {
      await addVariant(variantId);
      return;
    }

    if (!variants || variants.length === 0) return;
    if (!hasSelectableSizes(variants)) {
      await addVariant(variants[0].id);
      return;
    }

    setPickedVariantId(variants[0].id);
    setModalOpen(true);
  }

  async function confirmPickedVariant() {
    if (!pickedVariantId) return;
    setModalOpen(false);
    await addVariant(pickedVariantId);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending || status === "loading"}
        aria-label={`افزودن ${productName} به سبد خرید`}
        className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 text-xs font-semibold text-white transition-colors active:scale-95 hover:bg-primary-dark disabled:opacity-60 disabled:active:scale-100 ${className}`}
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <ShoppingCart className="h-4 w-4" aria-hidden="true" />
        )}
        افزودن به سبد
      </button>

      {variants && variants.length > 0 && (
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`انتخاب سایز ${productName}`}>
          <div className="flex flex-col gap-4">
            <SizeSelector
              variants={variants}
              selectedId={pickedVariantId}
              onSelect={setPickedVariantId}
            />
            <button
              type="button"
              onClick={confirmPickedVariant}
              className="flex h-11 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              افزودن به سبد خرید
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
