"use client";

import { useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import { useWishlist } from "@/components/wishlist/WishlistProvider";
import { WishlistItemCard } from "@/components/wishlist/WishlistItemCard";
import { WishlistEmptyState } from "@/components/wishlist/WishlistEmptyState";
import { WishlistLoginPrompt } from "@/components/wishlist/WishlistLoginPrompt";
import { WishlistPageSkeleton } from "@/components/wishlist/WishlistPageSkeleton";
import { listWishlist, type PublicWishlistItem } from "@/lib/api";

const PAGE_SIZE = 20;

export default function WishlistPage() {
  const { status, items, count, itemsComplete } = useWishlist();
  const [page, setPage] = useState(1);
  // Only ever populated for the rare wishlist too large for the provider's
  // own cache to hold in full — see `needsLiveFetch` below. `fallbackPage`
  // tracks which page these belong to, so "loading" can be derived (current
  // page vs. last-completed page) instead of toggled by hand.
  const [fallbackItems, setFallbackItems] = useState<PublicWishlistItem[] | null>(null);
  const [fallbackPage, setFallbackPage] = useState<number | null>(null);
  const [fallbackError, setFallbackError] = useState(false);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  // Clamp during render rather than "correcting" `page` in an effect — e.g.
  // removing the last item on page 2 should land back on page 1 the instant
  // `count` drops, not one extra render later, and never leave the user
  // stranded looking at a page that no longer exists.
  const currentPage = Math.min(page, totalPages);

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const expectedOnThisPage = Math.max(0, Math.min(PAGE_SIZE, count - startIndex));
  const cachedSlice = items.slice(startIndex, startIndex + PAGE_SIZE);
  // True once the provider's own cache already covers this page — the
  // overwhelmingly common case, since it fetches everything up to 100 items
  // on mount. Only a wishlist bigger than that needs a page-specific fetch.
  const cacheSatisfiesPage = itemsComplete || cachedSlice.length >= expectedOnThisPage;
  const needsLiveFetch = status === "ready" && !cacheSatisfiesPage && count > 0;

  useEffect(() => {
    if (!needsLiveFetch) return;
    listWishlist({ page: currentPage, limit: PAGE_SIZE })
      .then((res) => {
        setFallbackItems(res.items);
        setFallbackError(false);
        setFallbackPage(currentPage);
      })
      .catch(() => {
        setFallbackError(true);
        setFallbackPage(currentPage);
      });
  }, [needsLiveFetch, currentPage]);

  const fallbackLoading = needsLiveFetch && fallbackPage !== currentPage;
  // Only trust `fallbackError` when it actually belongs to the page being
  // shown right now — otherwise a failure on a page the user has since left
  // would incorrectly flash the error message over a perfectly fine page.
  const showFallbackError = needsLiveFetch && fallbackPage === currentPage && fallbackError;
  const pageItems = needsLiveFetch ? (fallbackItems ?? []) : cachedSlice;
  const isPageLoading = status === "loading" || fallbackLoading;

  return (
    <Container className="py-10">
      <h1 className="text-2xl font-bold text-navy">علاقه‌مندی‌های من</h1>
      <p className="mt-1 text-sm text-secondary-text">
        محصولاتی که برای بررسی یا تصمیم‌گیری بعدی ذخیره کرده‌اید.
      </p>

      <div className="mt-8">
        {status === "anonymous" && <WishlistLoginPrompt />}

        {status !== "anonymous" && isPageLoading && <WishlistPageSkeleton />}

        {status === "ready" && !isPageLoading && showFallbackError && (
          <p className="py-16 text-center text-sm text-accent-red">
            دریافت علاقه‌مندی‌ها با خطا مواجه شد. لطفاً صفحه را رفرش کنید.
          </p>
        )}

        {status === "ready" && !isPageLoading && !showFallbackError && count === 0 && (
          <WishlistEmptyState />
        )}

        {status === "ready" && !isPageLoading && !showFallbackError && count > 0 && (
          <>
            <div className="flex flex-col gap-4">
              {pageItems.map((item) => (
                <WishlistItemCard key={item.wishlistItemId} item={item} />
              ))}
            </div>

            {totalPages > 1 && (
              <nav
                aria-label="صفحه‌بندی علاقه‌مندی‌ها"
                className="mt-8 flex items-center justify-center gap-2"
              >
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((targetPage) => (
                  <button
                    key={targetPage}
                    type="button"
                    onClick={() => setPage(targetPage)}
                    aria-current={targetPage === currentPage ? "page" : undefined}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                      targetPage === currentPage
                        ? "bg-primary text-white"
                        : "text-secondary-text hover:bg-medical-bg"
                    }`}
                  >
                    {targetPage.toLocaleString("fa-IR")}
                  </button>
                ))}
              </nav>
            )}
          </>
        )}
      </div>
    </Container>
  );
}
