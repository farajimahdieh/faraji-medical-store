import { Heart } from "lucide-react";
import Link from "next/link";

export function WishlistEmptyState() {
  return (
    <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-white py-16 text-center">
      <Heart className="h-10 w-10 text-secondary-text" aria-hidden="true" />
      <div>
        <p className="text-sm font-bold text-navy">هنوز چیزی ذخیره نکرده‌اید</p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-secondary-text">
          محصولاتی که می‌خواهید بعداً بررسی کنید یا درباره‌شان مشورت بگیرید، با
          زدن قلب اینجا ذخیره می‌شوند.
        </p>
      </div>
      <Link
        href="/products"
        className="rounded-xl bg-medical-bg px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white"
      >
        مشاهده محصولات
      </Link>
    </div>
  );
}
