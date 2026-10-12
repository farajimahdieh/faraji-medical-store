import type { PublicOrderDetail } from "@/lib/api";
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/order-labels";
import { STORE_ADDRESS } from "@/data/store";

// Delivery + payment summary of an order, shared by the customer's and the
// admin's order pages.
export function OrderFulfillment({ order }: { order: PublicOrderDetail }) {
  const { address } = order;
  const isPickup = order.paymentMethod === "pay_at_store";

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <h2 className="mb-3 text-sm font-bold text-navy">
        {isPickup ? "تحویل حضوری از فروشگاه" : "آدرس ارسال"}
      </h2>
      <p className="text-sm text-navy">
        {address.recipientName && `${address.recipientName} - `}
        <span dir="ltr">{address.recipientPhone}</span>
      </p>
      <p className="mt-1 text-sm text-secondary-text">
        {isPickup ? (
          STORE_ADDRESS
        ) : (
          <>
            {address.province}، {address.city}، {address.addressLine}
            {address.buildingNumber && ` - پلاک ${address.buildingNumber}`}
            {address.unit && `، واحد ${address.unit}`}
          </>
        )}
      </p>
      {order.paymentMethod && (
        <p className="mt-3 border-t border-border pt-3 text-sm text-secondary-text">
          روش پرداخت:{" "}
          <span className="text-navy">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</span>
          {" — "}
          {PAYMENT_STATUS_LABELS[order.paymentStatus]}
        </p>
      )}
    </div>
  );
}
