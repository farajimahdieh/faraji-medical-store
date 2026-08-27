import type { OrderStatus } from "@/lib/api";

const STATUS_META: Record<OrderStatus, { label: string; className: string }> = {
  pending_payment: { label: "در انتظار پرداخت", className: "bg-medical-bg text-secondary-text" },
  paid: { label: "پرداخت‌شده", className: "bg-tint-blue text-primary" },
  processing: { label: "در حال پردازش", className: "bg-tint-blue text-primary" },
  shipped: { label: "ارسال‌شده", className: "bg-tint-blue text-primary" },
  delivered: { label: "تحویل داده‌شده", className: "bg-primary text-white" },
  cancelled: { label: "لغو شده", className: "bg-tint-red text-accent-red" },
  refunded: { label: "بازگردانده شده", className: "bg-tint-red text-accent-red" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.className}`}>
      {meta.label}
    </span>
  );
}
