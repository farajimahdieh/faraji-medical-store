"use client";

import { useState } from "react";
import { formatToman } from "@/data/products";
import type { PublicProductVariant } from "@/lib/api";
import { formatStockStatus } from "@/lib/catalog-format";

const stockToneClass: Record<"positive" | "negative" | "neutral", string> = {
  positive: "text-primary",
  negative: "text-accent-red",
  neutral: "text-secondary-text",
};

const UNNAMED_SIZE_LABELS = new Set(["تک سایز", "یک‌سایز", "یکسایز"]);

export function SizeSelector({ variants }: { variants: PublicProductVariant[] }) {
  const [selectedId, setSelectedId] = useState(variants[0]?.id);
  if (variants.length === 0) return null;

  const selected = variants.find((variant) => variant.id === selectedId) ?? variants[0];
  const showSizeButtons = !(
    variants.length === 1 && UNNAMED_SIZE_LABELS.has(variants[0].size)
  );
  const stock = formatStockStatus(
    selected.stock === null ? "unknown" : selected.stock > 0 ? "in_stock" : "out_of_stock",
  );

  return (
    <div className="flex flex-col gap-3">
      {showSizeButtons && (
        <div>
          <p className="mb-2 text-sm font-medium text-navy">سایز</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => (
              <button
                key={variant.id}
                type="button"
                onClick={() => setSelectedId(variant.id)}
                aria-pressed={variant.id === selectedId}
                className={`flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-medium transition-colors ${
                  variant.id === selectedId
                    ? "border-primary bg-primary text-white"
                    : "border-border text-navy hover:border-primary/50"
                }`}
              >
                {variant.size}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between rounded-xl bg-medical-bg px-4 py-3">
        <span className="text-lg font-bold text-navy">
          {selected.price !== null
            ? formatToman(selected.price)
            : "قیمت پس از اتصال به سیستم فروش"}
        </span>
        <span className={`text-xs font-medium ${stockToneClass[stock.tone]}`}>
          {stock.label}
        </span>
      </div>
    </div>
  );
}
