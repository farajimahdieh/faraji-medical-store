"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { listRecentlyViewed, recordRecentlyViewed, type PublicProductDetail, type PublicProductListItem } from "@/lib/api";
import { addRecentlyViewedLocal, buildLocalEntryFromDetail } from "@/lib/recently-viewed";
import { ProductCard } from "./ProductCard";

const FETCH_LIMIT = 9; // headroom in case the current product is among the results
const MOBILE_MAX = 8;
const DESKTOP_MAX = 4;

export function RecentlyViewedSection({ product }: { product: PublicProductDetail }) {
  const { status: authStatus } = useAuth();
  const [items, setItems] = useState<PublicProductListItem[] | null>(null);

  useEffect(() => {
    if (authStatus === "loading") return;
    let cancelled = false;

    if (authStatus === "authenticated") {
      recordRecentlyViewed(product.id).catch(() => {});
      listRecentlyViewed(FETCH_LIMIT)
        .then((data) => {
          if (cancelled) return;
          setItems(data.filter((item) => item.id !== product.id));
        })
        .catch(() => {
          if (!cancelled) setItems([]);
        });
    } else {
      // Deferred via a resolved promise, matching the authenticated branch
      // above -- setState only happens inside a .then(), never synchronously
      // in the effect body itself (avoids cascading renders).
      Promise.resolve().then(() => {
        if (cancelled) return;
        const entry = buildLocalEntryFromDetail(product);
        const all = addRecentlyViewedLocal(entry);
        setItems(all.filter((item) => item.id !== product.id));
      });
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `product` is only used for its stable id/detail snapshot, not re-run per render identity
  }, [authStatus, product.id]);

  if (!items || items.length < 2) return null;

  return (
    <section className="mt-14">
      <h2 className="text-lg font-bold text-navy">محصولات اخیراً دیده‌شده</h2>

      {/* Mobile: horizontal scroll row. */}
      <div className="mt-5 flex gap-4 overflow-x-auto pb-2 lg:hidden">
        {items.slice(0, MOBILE_MAX).map((item) => (
          <div key={item.id} className="w-[170px] shrink-0">
            <ProductCard product={item} />
          </div>
        ))}
      </div>

      {/* Desktop: fixed 4-column grid, no scroll. */}
      <div className="mt-5 hidden gap-4 lg:grid lg:grid-cols-4">
        {items.slice(0, DESKTOP_MAX).map((item) => (
          <ProductCard key={item.id} product={item} />
        ))}
      </div>
    </section>
  );
}
