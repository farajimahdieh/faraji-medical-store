"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { OrderFulfillment } from "@/components/account/OrderFulfillment";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/toast/ToastProvider";
import { formatToman } from "@/data/products";
import {
  ApiError,
  mediaUrl,
  type OrderStatus,
  type PaymentStatus,
  type PublicOrderDetail,
} from "@/lib/api";
import { getAdminOrder, updateAdminOrderStatus } from "@/lib/admin-api";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/order-labels";

// The statuses staff move an offline-paid order through.
const STATUS_OPTIONS: OrderStatus[] = ["processing", "shipped", "delivered", "cancelled"];
const PAYMENT_OPTIONS: PaymentStatus[] = ["pending", "paid"];

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const [order, setOrder] = useState<PublicOrderDetail | null>(null);
  const [status, setStatus] = useState<OrderStatus>("processing");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("pending");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAdminOrder(id).then((loaded) => {
      setOrder(loaded);
      setStatus(loaded.status);
      setPaymentStatus(loaded.paymentStatus);
    });
  }, [id]);

  if (!order) return <p className="text-sm text-secondary-text">در حال بارگذاری...</p>;

  const changed = status !== order.status || paymentStatus !== order.paymentStatus;

  async function handleSave() {
    if (!order || !changed) return;
    setSaving(true);
    try {
      const updated = await updateAdminOrderStatus(order.id, { status, paymentStatus });
      setOrder(updated);
      showToast("وضعیت سفارش ذخیره شد", { variant: "success" });
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : "ذخیره با خطا مواجه شد", {
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  const selectClass =
    "h-10 rounded-xl border border-border bg-white px-3 text-sm text-navy outline-none focus:border-primary";

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">سفارش {order.orderNumber}</h1>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mb-6 rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-3 font-bold text-navy">وضعیت سفارش</h2>
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1 text-xs text-secondary-text">
            وضعیت
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as OrderStatus)}
              className={selectClass}
            >
              {/* Keep a legacy status selectable so the select shows it. */}
              {[...new Set([order.status, ...STATUS_OPTIONS])].map((option) => (
                <option key={option} value={option}>
                  {ORDER_STATUS_LABELS[option]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-secondary-text">
            پرداخت
            <select
              value={paymentStatus}
              onChange={(event) => setPaymentStatus(event.target.value as PaymentStatus)}
              className={selectClass}
            >
              {[...new Set([order.paymentStatus, ...PAYMENT_OPTIONS])].map((option) => (
                <option key={option} value={option}>
                  {PAYMENT_STATUS_LABELS[option]}
                </option>
              ))}
            </select>
          </label>
          <Button onClick={handleSave} disabled={!changed || saving}>
            {saving ? "در حال ذخیره..." : "ذخیره"}
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <OrderFulfillment order={order} />
      </div>

      {order.notes && (
        <div className="mb-6 rounded-2xl border border-border bg-white p-6">
          <h2 className="mb-2 font-bold text-navy">توضیحات مشتری</h2>
          <p className="text-sm text-secondary-text">{order.notes}</p>
        </div>
      )}

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
