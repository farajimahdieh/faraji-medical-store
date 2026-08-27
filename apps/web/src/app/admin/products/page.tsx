"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { listAdminProducts, type AdminProductListItem } from "@/lib/admin-api";
import { mediaUrl } from "@/lib/api";
import { PRODUCT_STATUS_LABELS } from "@/lib/product-status";

export default function AdminProductsPage() {
  const [items, setItems] = useState<AdminProductListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  // setState only happens inside the promise handlers, never synchronously
  // in the effect body itself (a debounce would be nicer for real typing
  // volume, but out of scope here).
  useEffect(() => {
    listAdminProducts({ q: q || undefined, limit: 50 })
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }, [q]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-navy">محصولات ({total})</h1>
        <Link href="/admin/products/new">
          <Button>+ محصول جدید</Button>
        </Link>
      </div>

      <input
        type="text"
        placeholder="جستجوی نام یا اسلاگ..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="mb-4 h-11 w-full max-w-sm rounded-xl border border-border px-3 text-navy outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
      />

      {loading ? (
        <p className="text-sm text-secondary-text">در حال بارگذاری...</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-white">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-border text-right text-secondary-text">
                <th className="p-3 font-medium">تصویر</th>
                <th className="p-3 font-medium">نام</th>
                <th className="p-3 font-medium">برند</th>
                <th className="p-3 font-medium">وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {items.map((product) => {
                const primary = product.images.find((img) => img.isPrimary) ?? product.images[0];
                return (
                  <tr key={product.id} className="border-b border-border last:border-0 hover:bg-medical-bg/40">
                    <td className="p-3">
                      {primary ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={mediaUrl(primary.url)} alt="" className="h-12 w-12 rounded-lg object-cover" />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-medical-bg" />
                      )}
                    </td>
                    <td className="p-3">
                      <Link href={`/admin/products/${product.id}`} className="font-medium text-primary hover:underline">
                        {product.name}
                      </Link>
                    </td>
                    <td className="p-3 text-navy">{product.brand?.name ?? "—"}</td>
                    <td className="p-3 text-navy">{PRODUCT_STATUS_LABELS[product.status]}</td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-secondary-text">
                    محصولی یافت نشد
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
