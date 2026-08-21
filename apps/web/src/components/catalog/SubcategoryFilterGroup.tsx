import Link from "next/link";
import type { ListingSearchParams } from "@/lib/query-params";

export interface SubcategoryOption {
  name: string;
  slug: string;
  count: number;
}

// Unlike brand/size, "subcategory" isn't a query param — each subcategory
// is a real Category in its own right, so selecting one just navigates to
// that category's own /categories/[slug] page (carrying over q/sort, but
// resetting brand/size/page, since those don't necessarily still apply).
function hrefFor(slug: string, current: ListingSearchParams): string {
  const search = new URLSearchParams();
  if (current.q) search.set("q", current.q);
  if (current.sort) search.set("sort", current.sort);
  const qs = search.toString();
  return qs ? `/categories/${slug}?${qs}` : `/categories/${slug}`;
}

export function SubcategoryFilterGroup({
  options,
  activeSlug,
  searchParams,
}: {
  options: SubcategoryOption[];
  activeSlug?: string;
  searchParams: ListingSearchParams;
}) {
  if (options.length === 0) return null;

  return (
    <fieldset className="border-b border-border pb-5">
      <legend className="mb-3 text-sm font-bold text-navy">زیردسته</legend>
      <ul className="flex flex-col gap-1">
        {options.map((option) => {
          const isActive = option.slug === activeSlug;
          return (
            <li key={option.slug}>
              <Link
                href={hrefFor(option.slug, searchParams)}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors ${
                  isActive
                    ? "bg-tint-blue font-medium text-primary"
                    : "text-secondary-text hover:bg-medical-bg hover:text-navy"
                }`}
              >
                {option.name}
                <span className="text-xs text-secondary-text">
                  {option.count.toLocaleString("fa-IR")}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
