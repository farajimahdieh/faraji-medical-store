import type { OrderStatus } from "@/lib/api";
import { ORDER_STATUS_LABELS } from "@/lib/order-labels";

const STATUS_CLASS: Record<OrderStatus, string> = {
  pending_payment: "bg-medical-bg text-secondary-text",
  paid: "bg-tint-blue text-primary",
  processing: "bg-tint-blue text-primary",
  shipped: "bg-tint-blue text-primary",
  delivered: "bg-primary text-white",
  cancelled: "bg-tint-red text-accent-red",
  refunded: "bg-tint-red text-accent-red",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_CLASS[status]}`}>
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}
