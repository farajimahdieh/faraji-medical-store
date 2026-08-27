"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ApiError, mediaUrl } from "@/lib/api";
import { approveProduct, listPendingProducts, rejectProduct, type AdminProductListItem } from "@/lib/admin-api";
import { PRODUCT_STATUS_LABELS } from "@/lib/product-status";

export default function PendingProductsPage() {
  const [items, setItems] = useState<AdminProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  // setState only happens inside the promise handlers, never synchronously
  // in the effect body itself. `loading` only ever reflects the very first
  // fetch -- later reloads (after approve/reject) update the list in place
  // without hiding it behind a loading state.
  function reload() {
    listPendingProducts()
      .then(setItems)
      .catch((err) => setError(err instanceof ApiError ? err.message : "خطایی رخ داد"))
      .finally(() => setLoading(false));
  }

  useEffect(reload, []);

  async function handleApprove(id: string) {
    setError(null);
    try {
      await approveProduct(id);
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطایی رخ داد");
    }
  }

  async function handleReject(id: string) {
    if (!reason.trim()) return;
    setError(null);
    try {
      await rejectProduct(id, reason.trim());
      setRejectingId(null);
      setReason("");
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطایی رخ داد");
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-navy">محصولات در انتظار بررسی ({items.length})</h1>
      <p className="mb-6 text-sm text-secondary-text">
        محصولات پس از ایجاد اینجا قرار می‌گیرند. تایید کنید تا در سایت منتشر شود، یا رد کنید و دلیل آن را بنویسید.
      </p>

      {error && <p className="mb-4 text-sm text-accent-red">{error}</p>}

      {loading ? (
        <p className="text-sm text-secondary-text">در حال بارگذاری...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-secondary-text">محصولی در انتظار بررسی نیست.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((product) => {
            const primary = product.images.find((img) => img.isPrimary) ?? product.images[0];
            return (
              <div key={product.id} className="rounded-2xl border border-border bg-white p-4">
                <div className="flex items-center gap-4">
                  {primary ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediaUrl(primary.url)} alt="" className="h-16 w-16 rounded-lg object-cover" />
                  ) : (
                    <div className="h-16 w-16 rounded-lg bg-medical-bg" />
                  )}
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/products/${product.id}`} className="font-medium text-primary hover:underline">
                      {product.name}
                    </Link>
                    <div className="text-xs text-secondary-text">
                      وضعیت فعلی: {PRODUCT_STATUS_LABELS[product.status]}
                      {product.rejectionReason && ` — رد قبلی: ${product.rejectionReason}`}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button onClick={() => handleApprove(product.id)}>تایید و انتشار</Button>
                    <Button
                      variant="danger-outline"
                      onClick={() => setRejectingId(rejectingId === product.id ? null : product.id)}
                    >
                      رد
                    </Button>
                  </div>
                </div>

                {rejectingId === product.id && (
                  <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="چه ایرادی داشت؟ (مثلاً: عکس واضح نیست، توضیحات ناقص است...)"
                      rows={2}
                      className="rounded-xl border border-border p-3 text-sm text-navy outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                    />
                    <Button variant="danger-outline" className="self-start" onClick={() => handleReject(product.id)}>
                      ثبت رد محصول
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
