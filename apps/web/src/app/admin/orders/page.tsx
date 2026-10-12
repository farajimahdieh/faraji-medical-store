"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listAdminOrders, type AdminOrderSummary } from "@/lib/admin-api";
import type { OrderStatus, PaymentStatus } from "@/lib/api";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/order-labels";

export default function AdminOrdersPage() {
  const [items, setItems] = useState<AdminOrderSummary[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    listAdminOrders({ limit: 50 }).then((res) => {
      setItems(res.items);
      setTotal(res.total);
    });
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-navy">سفارش‌ها ({total})</h1>
      <div className="overflow-x-auto rounded-2xl border border-border bg-white">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b border-border text-right text-secondary-text">
              <th className="p-3 font-medium">شماره سفارش</th>
              <th className="p-3 font-medium">وضعیت</th>
              <th className="p-3 font-medium">پرداخت</th>
              <th className="p-3 font-medium">مبلغ کل</th>
              <th className="p-3 font-medium">تاریخ</th>
            </tr>
          </thead>
          <tbody>
            {items.map((order) => (
              <tr key={order.id} className="border-b border-border last:border-0 hover:bg-medical-bg/40">
                <td className="p-3">
                  <Link href={`/admin/orders/${order.id}`} className="font-medium text-primary hover:underline">
                    {order.orderNumber}
                  </Link>
                </td>
                <td className="p-3 text-navy">{ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status}</td>
                <td className="p-3 text-navy">
                  {PAYMENT_STATUS_LABELS[order.paymentStatus as PaymentStatus] ?? order.paymentStatus}
                </td>
                <td className="p-3 text-navy">{order.totalAmount.toLocaleString("fa-IR")} تومان</td>
                <td className="p-3 text-secondary-text">{new Date(order.createdAt).toLocaleDateString("fa-IR")}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-secondary-text">
                  سفارشی یافت نشد
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
