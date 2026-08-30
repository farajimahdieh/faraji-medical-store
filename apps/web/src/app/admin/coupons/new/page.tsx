"use client";

import { useRouter } from "next/navigation";
import { createCoupon, type CouponInput } from "@/lib/admin-api";
import { CouponForm } from "../CouponForm";

export default function NewCouponPage() {
  const router = useRouter();

  async function handleSubmit(input: CouponInput) {
    const coupon = await createCoupon(input);
    router.push(`/admin/coupons/${coupon.id}`);
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-bold text-navy">کوپن جدید</h1>
      <CouponForm onSubmit={handleSubmit} submitLabel="ایجاد کوپن" />
    </div>
  );
}
