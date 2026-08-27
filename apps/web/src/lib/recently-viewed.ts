import type { PublicProductDetail, PublicProductListItem } from "./api";

// Guest (logged-out) recently-viewed storage. Denormalized snapshots (not
// just product IDs) so rendering the section never needs an extra fetch --
// same tradeoff as any "recently viewed" feature: a mild staleness risk on
// price/stock in exchange for zero additional requests.
const STORAGE_KEY = "faraji:recently-viewed";
const MAX_STORED = 20;

export interface LocalRecentlyViewedEntry extends PublicProductListItem {
  viewedAt: string;
}

function readAll(): LocalRecentlyViewedEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LocalRecentlyViewedEntry[]) : [];
  } catch {
    return [];
  }
}

function writeAll(entries: LocalRecentlyViewedEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Private browsing / quota exceeded -- fail silently, same as search-history.ts.
  }
}

export function getRecentlyViewedLocal(): LocalRecentlyViewedEntry[] {
  return readAll();
}

export function addRecentlyViewedLocal(
  entry: LocalRecentlyViewedEntry,
): LocalRecentlyViewedEntry[] {
  const withoutThisProduct = readAll().filter((e) => e.id !== entry.id);
  const next = [entry, ...withoutThisProduct].slice(0, MAX_STORED);
  writeAll(next);
  return next;
}

export function clearRecentlyViewedLocal(): void {
  writeAll([]);
}

// A product detail page has PublicProductDetail (images[]/variants[]), not
// the PublicProductListItem shape ProductCard needs (primaryImage/sizes/
// price/stockStatus) -- this mirrors the backend's resolvePriceDisplay/
// resolveStockStatus (apps/api/.../product.public.ts) just enough to build
// a snapshot entry client-side without an extra request.
export function buildLocalEntryFromDetail(product: PublicProductDetail): LocalRecentlyViewedEntry {
  const primaryImage = product.images.find((image) => image.isPrimary) ?? product.images[0] ?? null;

  const knownPrices = product.variants
    .map((variant) => variant.price)
    .filter((price): price is number => price !== null);
  const price: PublicProductListItem["price"] =
    knownPrices.length === 0
      ? { status: "unavailable", minPrice: null, maxPrice: null }
      : { status: "available", minPrice: Math.min(...knownPrices), maxPrice: Math.max(...knownPrices) };

  const knownStocks = product.variants
    .map((variant) => variant.stock)
    .filter((stock): stock is number => stock !== null);
  const stockStatus: PublicProductListItem["stockStatus"] =
    knownStocks.length === 0
      ? "unknown"
      : knownStocks.some((stock) => stock > 0)
        ? "in_stock"
        : "out_of_stock";

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    primaryImage,
    sizes: product.variants.map((variant) => variant.size),
    variants: product.variants,
    price,
    stockStatus,
    viewedAt: new Date().toISOString(),
  };
}
