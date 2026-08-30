"use client";

import { LogIn } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { currentPathWithQuery, loginHrefWithReturnTo } from "@/lib/return-to";

export function ConsultationLoginPrompt() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const returnTo = currentPathWithQuery(pathname, searchParams);

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-white py-16 text-center">
      <LogIn className="h-10 w-10 text-secondary-text" aria-hidden="true" />
      <p className="max-w-sm text-sm leading-6 font-medium text-navy">
        برای استفاده از مشاوره هوشمند وارد حساب کاربری شوید.
      </p>
      <Link
        href={loginHrefWithReturnTo(returnTo)}
        className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
      >
        ورود به حساب
      </Link>
    </div>
  );
}
