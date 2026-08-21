"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  addToWishlist,
  listWishlist,
  removeFromWishlist,
  type PublicWishlistItem,
} from "@/lib/api";
import { useToast } from "@/components/toast/ToastProvider";

export type WishlistStatus = "loading" | "anonymous" | "ready";

export interface WishlistTarget {
  productId: string;
  variantId?: string | null;
}

interface WishlistContextValue {
  status: WishlistStatus;
  /** Authoritative total from the backend — always correct even if `items` is a partial cache. */
  count: number;
  /** Every wishlist item fetched so far, newest first (matches the backend's own order). */
  items: PublicWishlistItem[];
  /** True once `items` is known to hold the entire wishlist. */
  itemsComplete: boolean;
  /** Whether this exact product (+ optional variant) is currently saved. */
  isSaved: (productId: string, variantId?: string | null) => boolean;
  /** Add if not saved, remove if saved. Resolves to whether it succeeded. */
  toggle: (target: WishlistTarget) => Promise<boolean>;
  /** Remove a specific, already-known item (used by the /wishlist page). */
  removeItem: (wishlistItemId: string) => Promise<boolean>;
  /** Update a cached item's note in place (after the /wishlist page saves one). */
  updateItemNote: (wishlistItemId: string, note: string | null) => void;
  /** Re-fetch from the server — call right after a successful login. */
  refresh: () => Promise<void>;
  /** Clear to the anonymous state without a network round-trip — call on logout. */
  reset: () => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

// A personal-store wishlist is never expected to run into the hundreds, but
// this loop (rather than trusting a single page) keeps `items` — the single
// shared cache every Heart, the header badge, and the /wishlist page all
// read from — complete instead of silently truncated.
const FETCH_LIMIT = 100;
const MAX_PAGES = 10;

function membershipKey(productId: string, variantId?: string | null): string {
  return `${productId}::${variantId ?? ""}`;
}

function byNewestFirst(a: PublicWishlistItem, b: PublicWishlistItem): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

interface WishlistSnapshot {
  total: number;
  items: PublicWishlistItem[];
  complete: boolean;
}

// Deliberately a plain module-level function, not a hook — the mount effect
// below calls it directly (rather than through a same-file useCallback) so
// the setState calls that follow are the effect's own `.then`/`.catch`
// handlers, not a locally-defined function the effect invokes synchronously.
async function fetchWishlistSnapshot(): Promise<WishlistSnapshot> {
  // GET /wishlist's own `total` is the same authoritative count a separate
  // /wishlist/count call would return, and this request is unavoidable
  // anyway (there's no lighter membership-only endpoint) — so getting count
  // "for free" from it, instead of an extra round-trip, is a straight win.
  const first = await listWishlist({ page: 1, limit: FETCH_LIMIT });
  const items = [...first.items];
  const totalPages = Math.ceil(first.total / FETCH_LIMIT);
  const pagesToFetch = Math.min(totalPages, MAX_PAGES);
  for (let page = 2; page <= pagesToFetch; page += 1) {
    const next = await listWishlist({ page, limit: FETCH_LIMIT });
    items.push(...next.items);
  }
  return { total: first.total, items, complete: pagesToFetch >= totalPages };
}

function buildPlaceholderItem(productId: string, variantId?: string | null): PublicWishlistItem {
  return {
    wishlistItemId: `__pending__:${productId}:${variantId ?? ""}:${Date.now()}`,
    productId,
    productName: "",
    productSlug: "",
    brand: null,
    primaryImage: null,
    variantId: variantId ?? null,
    size: null,
    price: { status: "unavailable", minPrice: null, maxPrice: null },
    stockStatus: "unknown",
    note: null,
    createdAt: new Date().toISOString(),
  };
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();
  const [status, setStatus] = useState<WishlistStatus>("loading");
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<PublicWishlistItem[]>([]);
  const [itemsComplete, setItemsComplete] = useState(false);
  // Guards a single product/variant against overlapping toggle calls (e.g. a
  // fast double click) without disabling every button on the page.
  const pendingKeys = useRef<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    try {
      const snapshot = await fetchWishlistSnapshot();
      setItems(snapshot.items);
      setCount(snapshot.total);
      setItemsComplete(snapshot.complete);
      setStatus("ready");
    } catch {
      // A 401 (not logged in) is the expected/common case here; any other
      // failure fails open the same way (hearts render as outline) — a
      // click will surface a real error toast instead of a broken page.
      setItems([]);
      setCount(0);
      setItemsComplete(true);
      setStatus("anonymous");
    }
  }, []);

  useEffect(() => {
    fetchWishlistSnapshot()
      .then((snapshot) => {
        setItems(snapshot.items);
        setCount(snapshot.total);
        setItemsComplete(snapshot.complete);
        setStatus("ready");
      })
      .catch(() => {
        setItems([]);
        setCount(0);
        setItemsComplete(true);
        setStatus("anonymous");
      });
  }, []);

  const membership = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of items) {
      map.set(membershipKey(item.productId, item.variantId), item.wishlistItemId);
    }
    return map;
  }, [items]);

  const isSaved = useCallback(
    (productId: string, variantId?: string | null) =>
      membership.has(membershipKey(productId, variantId)),
    [membership],
  );

  const toggle = useCallback(
    async ({ productId, variantId }: WishlistTarget): Promise<boolean> => {
      if (status !== "ready") return false;
      const key = membershipKey(productId, variantId);
      if (pendingKeys.current.has(key)) return false;
      pendingKeys.current.add(key);

      const existing = items.find(
        (item) => membershipKey(item.productId, item.variantId) === key,
      );

      try {
        if (existing) {
          setItems((prev) => prev.filter((item) => item.wishlistItemId !== existing.wishlistItemId));
          setCount((c) => Math.max(0, c - 1));
          await removeFromWishlist(existing.wishlistItemId);
          showToast("این کالا از علاقه‌مندی‌های شما حذف شد", { variant: "info" });
        } else {
          const placeholder = buildPlaceholderItem(productId, variantId);
          setItems((prev) => [placeholder, ...prev]);
          setCount((c) => c + 1);
          const created = await addToWishlist(productId, variantId ?? null);
          setItems((prev) =>
            prev.map((item) => (item.wishlistItemId === placeholder.wishlistItemId ? created : item)),
          );
          showToast("این کالا به علاقه‌مندی‌های شما اضافه شد", { variant: "success" });
        }
        return true;
      } catch {
        if (existing) {
          setItems((prev) => [...prev, existing].sort(byNewestFirst));
          setCount((c) => c + 1);
        } else {
          setItems((prev) => prev.filter((item) => membershipKey(item.productId, item.variantId) !== key));
          setCount((c) => Math.max(0, c - 1));
        }
        showToast("عملیات انجام نشد، دوباره تلاش کنید", { variant: "error" });
        return false;
      } finally {
        pendingKeys.current.delete(key);
      }
    },
    [status, items, showToast],
  );

  const removeItem = useCallback(
    async (wishlistItemId: string): Promise<boolean> => {
      const existing = items.find((item) => item.wishlistItemId === wishlistItemId);
      if (!existing) return false;
      const key = membershipKey(existing.productId, existing.variantId);
      if (pendingKeys.current.has(key)) return false;
      pendingKeys.current.add(key);

      setItems((prev) => prev.filter((item) => item.wishlistItemId !== wishlistItemId));
      setCount((c) => Math.max(0, c - 1));
      try {
        await removeFromWishlist(wishlistItemId);
        showToast("این کالا از علاقه‌مندی‌های شما حذف شد", { variant: "info" });
        return true;
      } catch {
        setItems((prev) => [...prev, existing].sort(byNewestFirst));
        setCount((c) => c + 1);
        showToast("عملیات انجام نشد، دوباره تلاش کنید", { variant: "error" });
        return false;
      } finally {
        pendingKeys.current.delete(key);
      }
    },
    [items, showToast],
  );

  const updateItemNote = useCallback((wishlistItemId: string, note: string | null) => {
    setItems((prev) =>
      prev.map((item) => (item.wishlistItemId === wishlistItemId ? { ...item, note } : item)),
    );
  }, []);

  const reset = useCallback(() => {
    setItems([]);
    setCount(0);
    setItemsComplete(true);
    setStatus("anonymous");
  }, []);

  return (
    <WishlistContext.Provider
      value={{
        status,
        count,
        items,
        itemsComplete,
        isSaved,
        toggle,
        removeItem,
        updateItemNote,
        refresh,
        reset,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return ctx;
}
