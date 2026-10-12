export interface Product {
  slug: string;
  name: string;
  brand: string;
  price: number;
  categorySlug: string;
}

export const featuredProducts: Product[] = [
  { slug: "digital-blood-pressure-monitor", name: "فشارسنج دیجیتال بازویی", brand: "برند نمونه", price: 1_850_000, categorySlug: "diagnostics-respiratory" },
  { slug: "nebulizer-compressor", name: "نبولایزر کمپرسوری", brand: "برند نمونه", price: 2_450_000, categorySlug: "diagnostics-respiratory" },
  { slug: "pulse-oximeter", name: "پالس اکسیمتر انگشتی", brand: "برند نمونه", price: 690_000, categorySlug: "diagnostics-respiratory" },
  { slug: "wheelchair-standard", name: "ویلچر استاندارد تاشو", brand: "برند نمونه", price: 6_900_000, categorySlug: "orthopedic-mobility" },
  { slug: "medical-gloves-box", name: "دستکش پزشکی (بسته ۱۰۰ عددی)", brand: "برند نمونه", price: 320_000, categorySlug: "medical-consumables" },
  { slug: "micropipette", name: "میکروپیپت آزمایشگاهی", brand: "برند نمونه", price: 4_100_000, categorySlug: "lab-equipment" },
];

// Customer-facing price: "۱۲۵ هزار تومان" instead of "۱۲۵,۰۰۰ تومان".
// Only switches to the "هزار" form when it stays exact (at most one decimal,
// e.g. "۶٫۵ هزار تومان") -- a money amount is never rounded for display, so
// odd totals (e.g. after a percentage coupon) keep the full figure.
export function formatToman(price: number): string {
  if (Math.abs(price) >= 1000 && price % 100 === 0) {
    const thousands = (price / 1000).toLocaleString("fa-IR", {
      maximumFractionDigits: 1,
    });
    return `${thousands} هزار تومان`;
  }
  return `${price.toLocaleString("fa-IR")} تومان`;
}
