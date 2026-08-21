import { formatToman } from "@/data/products";
import type { PublicPriceDisplay, StockStatus } from "@/lib/api";

export function formatPriceDisplay(price: PublicPriceDisplay): string {
  if (price.status === "unavailable" || price.minPrice === null) {
    return "قیمت پس از اتصال به سیستم فروش";
  }
  if (price.maxPrice !== null && price.maxPrice !== price.minPrice) {
    return `از ${formatToman(price.minPrice)}`;
  }
  return formatToman(price.minPrice);
}

export function formatStockStatus(status: StockStatus): {
  label: string;
  tone: "positive" | "negative" | "neutral";
} {
  switch (status) {
    case "in_stock":
      return { label: "موجود", tone: "positive" };
    case "out_of_stock":
      return { label: "ناموجود", tone: "negative" };
    default:
      return { label: "در حال همگام‌سازی موجودی", tone: "neutral" };
  }
}
