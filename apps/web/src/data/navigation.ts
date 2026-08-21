// "دسته‌بندی‌ها" is intentionally not listed here — the mega menu trigger
// next to these links already serves that purpose.
export const mainNavLinks = [
  { label: "محصولات", href: "/products" },
  { label: "راهنمای خرید", href: "/guides" },
  { label: "مشاوره هوشمند", href: "/consultation" },
  { label: "درباره ما", href: "/about" },
  { label: "تماس با ما", href: "/contact" },
];

export interface ShopByNeedItem {
  slug: string;
  label: string;
}

export const shopByNeedItems: ShopByNeedItem[] = [
  { slug: "home-care", label: "مراقبت در منزل" },
  { slug: "elderly-care", label: "مراقبت از سالمند" },
  { slug: "respiratory", label: "مشکلات تنفسی" },
  { slug: "mobility", label: "حرکت و توانبخشی" },
  { slug: "clinic", label: "مطب و کلینیک" },
  { slug: "laboratory", label: "آزمایشگاه" },
];
