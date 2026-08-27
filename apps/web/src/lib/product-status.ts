import type { ProductStatus } from "./admin-api";

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  draft: "پیش‌نویس",
  incomplete: "ناقص",
  needs_review: "نیاز به بررسی",
  active: "منتشرشده",
  hidden: "غیرفعال",
  archived: "بایگانی",
};
