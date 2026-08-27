import Link from "next/link";
import { formatToman } from "@/data/products";
import type { PublicOrderSummary } from "@/lib/api";
import { OrderStatusBadge } from "./OrderStatusBadge";

export function OrderCard({ order }: { order: PublicOrderSummary }) {
  return (
    <Link
      href={`/account/orders/${order.id}`}
      className="flex flex-col gap-2.5 rounded-2xl border border-border bg-white p-5 transition-colors hover:border-primary/40"
    >
      <div className="flex items-center justify-between gap-3">
        <span dir="ltr" className="font-mono text-sm font-bold text-navy">
          {order.orderNumber}
        </span>
        <OrderStatusBadge status={order.status} />
      </div>
      <div className="flex items-center justify-between gap-3 text-xs text-secondary-text">
        <span>{new Date(order.createdAt).toLocaleDateString("fa-IR")}</span>
        <span>{order.itemCount.toLocaleString("fa-IR")} کالا</span>
      </div>
      <span className="text-sm font-bold text-navy">{formatToman(order.totalAmount)}</span>
    </Link>
  );
}
