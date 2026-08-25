"use client";

import { Ticket } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCoupons } from "./useCoupons";
import { CouponCard } from "./CouponCard";

export function CouponsSection() {
  const { status, coupons, reload } = useCoupons();

  return (
    <div className="rounded-[24px] border border-border bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-lg font-bold text-navy">کدهای تخفیف من</h2>

      <div className="mt-6">
        {status === "loading" && <CouponsSkeleton />}

        {status === "error" && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-white py-16 text-center">
            <p className="text-sm text-accent-red">دریافت اطلاعات انجام نشد. دوباره تلاش کنید.</p>
            <Button variant="outline" onClick={reload}>
              تلاش دوباره
            </Button>
          </div>
        )}

        {status === "ready" && coupons.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-white py-16 text-center">
            <Ticket className="h-10 w-10 text-secondary-text" aria-hidden="true" />
            <p className="text-sm text-secondary-text">فعلاً کد تخفیفی برای حساب شما فعال نیست</p>
          </div>
        )}

        {status === "ready" && coupons.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {coupons.map((coupon) => (
              <CouponCard key={coupon.id} coupon={coupon} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CouponsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2" aria-hidden="true">
      {[0, 1].map((row) => (
        <div
          key={row}
          className="flex animate-pulse flex-col gap-3 rounded-2xl border border-border bg-white p-5"
        >
          <div className="h-5 w-1/2 rounded bg-medical-bg" />
          <div className="h-4 w-1/3 rounded bg-medical-bg" />
          <div className="h-3 w-2/3 rounded bg-medical-bg" />
        </div>
      ))}
    </div>
  );
}
