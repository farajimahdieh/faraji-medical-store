"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import { formatToman } from "@/data/products";
import { mediaUrl, type PublicOrderDetail } from "@/lib/api";
import { getAdminOrder } from "@/lib/admin-api";

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<PublicOrderDetail | null>(null);

  useEffect(() => {
    getAdminOrder(id).then(setOrder);
  }, [id]);

  if (!order) return <p className="text-sm text-secondary-text">در حال بارگذاری...</p>;

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">سفارش {order.orderNumber}</h1>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mb-6 rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-3 font-bold text-navy">آدرس گیرنده</h2>
        <p className="text-sm text-secondary-text">
          {order.address.recipientName} — {order.address.recipientPhone}
          <br />
          {order.address.province}، {order.address.city}، {order.address.addressLine}
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-3 font-bold text-navy">اقلام سفارش</h2>
        <div className="flex flex-col gap-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 border-b border-border pb-3 last:border-0">
              {item.primaryImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mediaUrl(item.primaryImage.url)} alt="" className="h-14 w-14 rounded-lg object-cover" />
              ) : (
                <div className="h-14 w-14 rounded-lg bg-medical-bg" />
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-navy">{item.productName}</div>
                <div className="text-xs text-secondary-text">
                  سایز {item.variantSize} × {item.quantity.toLocaleString("fa-IR")}
                </div>
              </div>
              <div className="text-sm font-semibold text-navy">{formatToman(item.lineTotal)}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-between border-t border-border pt-4 text-sm font-bold text-navy">
          <span>مبلغ کل</span>
          <span>{formatToman(order.totalAmount)}</span>
        </div>
      </div>
    </div>
  );
}
