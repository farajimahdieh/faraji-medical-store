"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { ApiError } from "@/lib/api";
import type { AdminCoupon, CouponAudienceType, CouponInput } from "@/lib/admin-api";

const AUDIENCE_OPTIONS: { value: CouponAudienceType; label: string }[] = [
  { value: "all", label: "همه کاربران" },
  { value: "specific_users", label: "کاربران مشخص" },
  { value: "no_orders_ever", label: "کاربران بدون خرید" },
  { value: "no_orders_in_months", label: "بدون خرید در N ماه اخیر" },
  { value: "min_orders", label: "حداقل N سفارش" },
  { value: "min_spend", label: "حداقل مبلغ خرید" },
];

export function CouponForm({
  initial,
  onSubmit,
  submitLabel,
}: {
  initial?: Partial<AdminCoupon>;
  onSubmit: (input: CouponInput) => Promise<void>;
  submitLabel: string;
}) {
  const [code, setCode] = useState(initial?.code ?? "");
  const [type, setType] = useState<"percentage" | "fixed_amount">(initial?.type ?? "fixed_amount");
  const [value, setValue] = useState(String(initial?.value ?? ""));
  const [usageLimit, setUsageLimit] = useState(String(initial?.usageLimit ?? ""));
  const [usagePerUser, setUsagePerUser] = useState(String(initial?.usagePerUser ?? ""));
  const [minimumOrderAmount, setMinimumOrderAmount] = useState(String(initial?.minimumOrderAmount ?? ""));
  const [maxDiscountAmount, setMaxDiscountAmount] = useState(String(initial?.maxDiscountAmount ?? ""));
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [audienceType, setAudienceType] = useState<CouponAudienceType>(initial?.audienceType ?? "all");
  const [audienceMonths, setAudienceMonths] = useState(String(initial?.audienceMonths ?? ""));
  const [audienceMinOrders, setAudienceMinOrders] = useState(String(initial?.audienceMinOrders ?? ""));
  const [audienceMinSpend, setAudienceMinSpend] = useState(String(initial?.audienceMinSpend ?? ""));
  const [audienceUserIds, setAudienceUserIds] = useState("");
  const [internalReason, setInternalReason] = useState(initial?.internalReason ?? "");
  const [campaignName, setCampaignName] = useState(initial?.campaignName ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function toNumber(v: string): number | undefined {
    return v.trim() === "" ? undefined : Number(v);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onSubmit({
        code,
        type,
        value: Number(value),
        usageLimit: toNumber(usageLimit),
        usagePerUser: toNumber(usagePerUser),
        minimumOrderAmount: toNumber(minimumOrderAmount),
        maxDiscountAmount: toNumber(maxDiscountAmount),
        isActive,
        audienceType,
        audienceMonths: audienceType === "no_orders_in_months" ? toNumber(audienceMonths) : undefined,
        audienceMinOrders: audienceType === "min_orders" ? toNumber(audienceMinOrders) : undefined,
        audienceMinSpend: audienceType === "min_spend" ? toNumber(audienceMinSpend) : undefined,
        audienceUserIds:
          audienceType === "specific_users"
            ? audienceUserIds.split(",").map((s) => s.trim()).filter(Boolean)
            : undefined,
        internalReason: internalReason || undefined,
        campaignName: campaignName || undefined,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطایی رخ داد");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-6">
      <TextField label="کد کوپن" value={code} onChange={(e) => setCode(e.target.value)} required />
      <label className="flex flex-col gap-1.5 text-sm text-secondary-text">
        نوع تخفیف
        <select
          value={type}
          onChange={(e) => setType(e.target.value as "percentage" | "fixed_amount")}
          className="h-11 rounded-xl border border-border px-3 text-navy outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
        >
          <option value="fixed_amount">مبلغ ثابت (تومان)</option>
          <option value="percentage">درصدی</option>
        </select>
      </label>
      <TextField
        label={type === "percentage" ? "درصد تخفیف" : "مبلغ تخفیف (تومان)"}
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        required
      />
      {type === "percentage" && (
        <TextField
          label="حداکثر مبلغ تخفیف (تومان، اختیاری)"
          type="number"
          value={maxDiscountAmount}
          onChange={(e) => setMaxDiscountAmount(e.target.value)}
        />
      )}
      <TextField
        label="حداقل مبلغ سفارش (اختیاری)"
        type="number"
        value={minimumOrderAmount}
        onChange={(e) => setMinimumOrderAmount(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="سقف تعداد استفاده کل (اختیاری)"
          type="number"
          value={usageLimit}
          onChange={(e) => setUsageLimit(e.target.value)}
        />
        <TextField
          label="سقف استفاده هر کاربر (اختیاری)"
          type="number"
          value={usagePerUser}
          onChange={(e) => setUsagePerUser(e.target.value)}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-navy">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        فعال
      </label>

      <hr className="border-border" />
      <label className="flex flex-col gap-1.5 text-sm text-secondary-text">
        مخاطب کوپن
        <select
          value={audienceType}
          onChange={(e) => setAudienceType(e.target.value as CouponAudienceType)}
          className="h-11 rounded-xl border border-border px-3 text-navy outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
        >
          {AUDIENCE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
      {audienceType === "no_orders_in_months" && (
        <TextField
          label="تعداد ماه اخیر"
          type="number"
          value={audienceMonths}
          onChange={(e) => setAudienceMonths(e.target.value)}
          required
        />
      )}
      {audienceType === "min_orders" && (
        <TextField
          label="حداقل تعداد سفارش"
          type="number"
          value={audienceMinOrders}
          onChange={(e) => setAudienceMinOrders(e.target.value)}
          required
        />
      )}
      {audienceType === "min_spend" && (
        <TextField
          label="حداقل مبلغ خرید (تومان)"
          type="number"
          value={audienceMinSpend}
          onChange={(e) => setAudienceMinSpend(e.target.value)}
          required
        />
      )}
      {audienceType === "specific_users" && (
        <TextField
          label="شناسه کاربران (با کاما جدا کنید)"
          value={audienceUserIds}
          onChange={(e) => setAudienceUserIds(e.target.value)}
          required
        />
      )}

      <hr className="border-border" />
      <TextField
        label="نام کمپین (داخلی، اختیاری)"
        value={campaignName}
        onChange={(e) => setCampaignName(e.target.value)}
      />
      <label className="flex flex-col gap-1.5 text-sm text-secondary-text">
        دلیل داخلی (به مشتری نمایش داده نمی‌شود)
        <textarea
          value={internalReason}
          onChange={(e) => setInternalReason(e.target.value)}
          rows={3}
          className="rounded-xl border border-border p-3 text-navy outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
      </label>

      {error && <p className="text-sm text-accent-red">{error}</p>}
      <Button type="submit" disabled={saving} className="self-start">
        {saving ? "در حال ذخیره..." : submitLabel}
      </Button>
    </form>
  );
}
