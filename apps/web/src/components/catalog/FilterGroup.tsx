import Link from "next/link";
import { buildListingHref, type ListingSearchParams } from "@/lib/query-params";

export interface FilterGroupOption {
  label: string;
  value: string;
  count: number;
}

export function FilterGroup({
  title,
  paramKey,
  options,
  basePath,
  searchParams,
  activeValue,
}: {
  title: string;
  paramKey: "brand" | "size";
  options: FilterGroupOption[];
  basePath: string;
  searchParams: ListingSearchParams;
  activeValue?: string;
}) {
  if (options.length === 0) return null;

  return (
    <fieldset className="border-b border-border pb-5">
      <legend className="mb-3 text-sm font-bold text-navy">{title}</legend>
      <ul className="flex flex-col gap-2">
        {options.map((option) => {
          const isActive = activeValue === option.value;
          const href = buildListingHref(basePath, searchParams, {
            [paramKey]: isActive ? undefined : option.value,
          });
          return (
            <li key={option.value}>
              <Link
                href={href}
                aria-pressed={isActive}
                className={`flex items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors ${
                  isActive
                    ? "bg-tint-blue font-medium text-primary"
                    : "text-secondary-text hover:bg-medical-bg hover:text-navy"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      isActive
                        ? "border-primary bg-primary text-white"
                        : "border-border"
                    }`}
                  >
                    {isActive && (
                      <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none">
                        <path
                          d="M2 6l2.5 2.5L10 3"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                  {option.label}
                </span>
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
