import { LogIn } from "lucide-react";
import Link from "next/link";

export function WishlistLoginPrompt() {
  return (
    <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-white py-16 text-center">
      <LogIn className="h-10 w-10 text-secondary-text" aria-hidden="true" />
      <p className="max-w-sm text-sm leading-6 font-medium text-navy">
        برای ذخیره علاقه‌مندی‌ها وارد حساب کاربری شوید.
      </p>
      <Link
        href="/login"
        className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
      >
        ورود به حساب
      </Link>
    </div>
  );
}
