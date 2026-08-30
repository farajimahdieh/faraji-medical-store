"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getCoupon, updateCoupon, type AdminCoupon, type CouponInput } from "@/lib/admin-api";
import { CouponForm } from "../CouponForm";

export default function EditCouponPage() {
  const { id } = useParams<{ id: string }>();
  const [coupon, setCoupon] = useState<AdminCoupon | null>(null);

  function reload() {
    getCoupon(id).then(setCoupon);
  }

  useEffect(reload, [id]);

  async function handleSubmit(input: CouponInput) {
    await updateCoupon(id, input);
    reload();
  }

  if (!coupon) return <p className="text-sm text-secondary-text">در حال بارگذاری...</p>;

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-bold text-navy">ویرایش کوپن {coupon.code}</h1>
      <CouponForm key={coupon.id} initial={coupon} onSubmit={handleSubmit} submitLabel="ذخیره تغییرات" />
    </div>
  );
}
