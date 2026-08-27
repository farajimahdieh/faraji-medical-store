import type { ReactNode } from "react";
import { formatToman } from "@/data/products";
import type { PublicCartSummary } from "@/lib/api";

export function CartSummary({ summary, cta }: { summary: PublicCartSummary; cta?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-5">
      <h2 className="text-sm font-bold text-navy">خلاصه سفارش</h2>
      <SummaryRow label="جمع کالاها" value={formatToman(summary.subtotal)} />
      {summary.discountAmount > 0 && (
        <SummaryRow label="تخفیف" value={`- ${formatToman(summary.discountAmount)}`} tone="positive" />
      )}
      <SummaryRow
        label="هزینه ارسال"
        value={summary.shippingAmount > 0 ? formatToman(summary.shippingAmount) : "رایگان"}
      />
      {summary.taxAmount > 0 && <SummaryRow label="مالیات" value={formatToman(summary.taxAmount)} />}
      <div className="border-t border-border pt-3">
        <SummaryRow label="مبلغ نهایی" value={formatToman(summary.totalAmount)} bold />
      </div>
      {cta}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  bold,
  tone,
}: {
  label: string;
  value: string;
  bold?: boolean;
  tone?: "positive";
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${bold ? "font-bold text-navy" : "text-secondary-text"}`}>{label}</span>
      <span
        className={`text-sm font-medium ${
          bold ? "font-bold text-navy" : tone === "positive" ? "text-primary" : "text-navy"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
