"use client";

import { ArrowRight, ImageIcon, RotateCcw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/toast/ToastProvider";
import { useCart } from "@/components/cart/CartProvider";
import { CartSummary } from "@/components/cart/CartSummary";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import { formatToman } from "@/data/products";
import { ApiError, getOrder, mediaUrl, reorderOrder, type PublicOrderDetail } from "@/lib/api";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const { refresh: refreshCart } = useCart();
  const [order, setOrder] = useState<PublicOrderDetail | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    getOrder(params.id)
      .then((data) => {
        setOrder(data);
        setStatus("ready");
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 401) {
          router.replace("/login");
          return;
        }
        setStatus("error");
      });
  }, [params.id, router]);

  async function handleReorder() {
    if (reordering) return;
    setReordering(true);
    try {
      const result = await reorderOrder(params.id);
      await refreshCart();
      if (result.addedCount > 0) {
        showToast(`${result.addedCount.toLocaleString("fa-IR")} کالا به سبد خرید اضافه شد`, {
          variant: "success",
        });
      }
      for (const skip of result.skipped) {
        showToast(`«${skip.productName}»: ${skip.reason}`, { variant: "error" });
      }
      if (result.addedCount > 0) router.push("/cart");
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : "خرید مجدد انجام نشد", {
        variant: "error",
      });
    } finally {
      setReordering(false);
    }
  }

  if (status === "loading") {
    return <p className="px-6 py-24 text-center text-sm text-secondary-text">در حال بارگذاری...</p>;
  }

  if (status === "error" || !order) {
    return (
      <Container className="py-16 text-center">
        <p className="text-sm text-accent-red">این سفارش یافت نشد.</p>
        <Link
          href="/account?section=orders"
          className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          بازگشت به سفارش‌ها
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-10">
      <Link
        href="/account?section=orders"
        className="inline-flex items-center gap-1.5 text-sm text-secondary-text transition-colors hover:text-primary"
      >
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
        بازگشت به سفارش‌ها
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 dir="ltr" className="font-mono text-xl font-bold text-navy">
            {order.orderNumber}
          </h1>
          <p className="mt-1 text-sm text-secondary-text">
            {new Date(order.createdAt).toLocaleDateString("fa-IR")}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-4 rounded-2xl border border-border bg-white p-4">
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-medical-bg">
                {item.primaryImage ? (
                  <Image
                    src={mediaUrl(item.primaryImage.url)}
                    alt={item.primaryImage.altText ?? item.productName}
                    fill
                    sizes="80px"
                    className="object-contain p-2"
                  />
                ) : (
                  <ImageIcon className="h-6 w-6 text-primary/40" aria-hidden="true" />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1">
                {item.productSlug ? (
                  <Link
                    href={`/products/${encodeURIComponent(item.productSlug)}`}
                    className="text-sm font-bold text-navy hover:text-primary"
                  >
                    {item.productName}
                  </Link>
                ) : (
                  <span className="text-sm font-bold text-navy">{item.productName}</span>
                )}
                {item.variantSize && (
                  <span className="text-xs text-secondary-text">سایز {item.variantSize}</span>
                )}
                <div className="mt-1 flex items-center justify-between text-sm">
                  <span className="text-secondary-text">
                    {item.quantity.toLocaleString("fa-IR")} × {formatToman(item.unitPrice)}
                  </span>
                  <span className="font-bold text-navy">{formatToman(item.lineTotal)}</span>
                </div>
              </div>
            </div>
          ))}

          <div className="rounded-2xl border border-border bg-white p-5">
            <h2 className="mb-3 text-sm font-bold text-navy">آدرس ارسال</h2>
            <p className="text-sm text-navy">
              {order.address.recipientName} - <span dir="ltr">{order.address.recipientPhone}</span>
            </p>
            <p className="mt-1 text-sm text-secondary-text">
              {order.address.province}، {order.address.city}، {order.address.addressLine}
              {order.address.buildingNumber && ` - پلاک ${order.address.buildingNumber}`}
              {order.address.unit && `، واحد ${order.address.unit}`}
            </p>
          </div>

          {order.notes && (
            <div className="rounded-2xl border border-border bg-white p-5">
              <h2 className="mb-2 text-sm font-bold text-navy">توضیحات سفارش</h2>
              <p className="text-sm text-secondary-text">{order.notes}</p>
            </div>
          )}
        </div>

        <div className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0">
          <CartSummary summary={order} />

          <Button onClick={handleReorder} disabled={reordering} variant="outline" className="w-full">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            {reordering ? "در حال افزودن..." : "خرید مجدد"}
          </Button>
        </div>
      </div>
    </Container>
  );
}
