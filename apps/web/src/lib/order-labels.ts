import type { OrderStatus, PaymentMethod, PaymentStatus } from "./api";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash_on_delivery: "پرداخت در محل، هنگام تحویل",
  pay_at_store: "تحویل و پرداخت در فروشگاه",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "پرداخت نشده",
  paid: "پرداخت‌شده",
  failed: "ناموفق",
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: "در انتظار پرداخت",
  paid: "پرداخت‌شده",
  processing: "در حال پردازش",
  shipped: "ارسال‌شده",
  delivered: "تحویل داده‌شده",
  cancelled: "لغو شده",
  refunded: "بازگردانده شده",
};
