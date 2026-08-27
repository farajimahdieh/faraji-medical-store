"use client";

import { CheckCircle2, MapPin, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/components/cart/CartProvider";
import { CartSummary } from "@/components/cart/CartSummary";
import { useAddresses } from "@/components/account/useAddresses";
import { AddressFormModal } from "@/components/account/AddressFormModal";
import { useToast } from "@/components/toast/ToastProvider";
import { loginHrefWithReturnTo } from "@/lib/return-to";
import { ApiError, createOrder, type AddressInput } from "@/lib/api";

const SHIPPING_METHOD = "ارسال استاندارد";

export default function CheckoutPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { status: cartStatus, items, summary, refresh: refreshCart } = useCart();
  const { status: addressStatus, addresses, add } = useAddresses();
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (cartStatus === "anonymous") {
      router.replace(loginHrefWithReturnTo("/checkout"));
    }
  }, [cartStatus, router]);

  useEffect(() => {
    if (addressStatus === "ready" && !selectedAddressId) {
      const defaultAddress = addresses.find((address) => address.isDefault) ?? addresses[0];
      if (defaultAddress) setSelectedAddressId(defaultAddress.id);
    }
  }, [addressStatus, addresses, selectedAddressId]);

  if (cartStatus === "loading" || cartStatus === "anonymous" || addressStatus === "loading") {
    return (
      <p className="px-6 py-24 text-center text-sm text-secondary-text">در حال بارگذاری...</p>
    );
  }

  const hasUnavailable = items.some((item) => item.unavailable);
  if (items.length === 0 || hasUnavailable) {
    return (
      <Container className="py-16 text-center">
        <p className="text-sm font-bold text-navy">
          {items.length === 0 ? "سبد خرید شما خالی است" : "سبد خرید شما شامل کالای ناموجود است"}
        </p>
        <Link
          href="/cart"
          className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          بازگشت به سبد خرید
        </Link>
      </Container>
    );
  }

  async function handleAddAddress(input: AddressInput) {
    await add(input);
    setModalOpen(false);
  }

  async function handleSubmit() {
    if (!selectedAddressId || submitting) return;
    setSubmitting(true);
    try {
      const order = await createOrder({
        addressId: selectedAddressId,
        shippingMethod: SHIPPING_METHOD,
        notes: notes.trim() || undefined,
      });
      showToast("سفارش با موفقیت ثبت شد", { variant: "success" });
      await refreshCart();
      router.push(`/account/orders/${order.id}`);
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : "ثبت سفارش با خطا مواجه شد", {
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Container className="py-10">
      <h1 className="text-2xl font-bold text-navy">تسویه‌حساب</h1>

      <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <section className="rounded-2xl border border-border bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-navy">آدرس ارسال</h2>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                آدرس جدید
              </button>
            </div>

            {addresses.length === 0 ? (
              <p className="mt-4 text-sm text-secondary-text">هنوز آدرسی ثبت نکرده‌اید.</p>
            ) : (
              <div className="mt-4 flex flex-col gap-3">
                {addresses.map((address) => (
                  <button
                    key={address.id}
                    type="button"
                    onClick={() => setSelectedAddressId(address.id)}
                    aria-pressed={selectedAddressId === address.id}
                    className={`flex items-start justify-between gap-3 rounded-xl border p-4 text-right transition-colors ${
                      selectedAddressId === address.id
                        ? "border-primary bg-tint-blue"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      <div className="text-sm">
                        <p className="font-bold text-navy">
                          {address.title} - {address.recipientName}
                        </p>
                        <p className="mt-1 text-secondary-text">
                          {address.province}، {address.city}، {address.addressLine}
                        </p>
                        <p dir="ltr" className="mt-1 text-secondary-text">
                          {address.recipientPhone}
                        </p>
                      </div>
                    </div>
                    {selectedAddressId === address.id && (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-white p-5">
            <h2 className="text-sm font-bold text-navy">روش ارسال</h2>
            <div className="mt-3 flex items-center justify-between rounded-xl border border-primary bg-tint-blue p-4 text-sm">
              <span className="font-medium text-navy">{SHIPPING_METHOD}</span>
              <span className="font-bold text-primary">رایگان</span>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-white p-5">
            <label htmlFor="order-notes" className="text-sm font-bold text-navy">
              توضیحات سفارش (اختیاری)
            </label>
            <textarea
              id="order-notes"
              rows={3}
              maxLength={1000}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="mt-3 w-full rounded-xl border border-border px-3 py-2.5 text-sm text-navy outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </section>
        </div>

        <div className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0">
          <CartSummary
            summary={summary}
            cta={
              <Button
                onClick={handleSubmit}
                disabled={!selectedAddressId || submitting}
                className="mt-2 w-full"
              >
                {submitting ? "در حال ثبت سفارش..." : "ثبت سفارش"}
              </Button>
            }
          />
        </div>
      </div>

      <AddressFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAddAddress}
        autoDefault={addresses.length === 0}
      />
    </Container>
  );
}
