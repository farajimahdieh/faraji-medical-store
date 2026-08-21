import Link from "next/link";
import { SearchX } from "lucide-react";

export function EmptyState({ clearHref }: { clearHref: string }) {
  return (
    <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-white py-16 text-center">
      <SearchX className="h-10 w-10 text-secondary-text" aria-hidden="true" />
      <p className="text-sm font-medium text-navy">
        محصولی با این مشخصات پیدا نشد.
      </p>
      <Link
        href={clearHref}
        className="rounded-xl bg-medical-bg px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white"
      >
        پاک کردن فیلترها
      </Link>
    </div>
  );
}
