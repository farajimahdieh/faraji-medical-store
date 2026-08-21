import Link from "next/link";
import { X } from "lucide-react";
import { buildListingHref, type ListingSearchParams } from "@/lib/query-params";

export interface ActiveFilterChip {
  key: "q" | "brand" | "size";
  label: string;
}

export function ActiveFilterChips({
  chips,
  basePath,
  searchParams,
}: {
  chips: ActiveFilterChip[];
  basePath: string;
  searchParams: ListingSearchParams;
}) {
  if (chips.length === 0) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Link
          key={chip.key}
          href={buildListingHref(basePath, searchParams, { [chip.key]: undefined })}
          className="flex items-center gap-1.5 rounded-full bg-tint-blue px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-white"
        >
          {chip.label}
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      ))}
      <Link
        href={buildListingHref(basePath, searchParams, {
          q: undefined,
          brand: undefined,
          size: undefined,
        })}
        className="text-xs font-medium text-secondary-text underline-offset-2 hover:text-accent-red hover:underline"
      >
        حذف همه فیلترها
      </Link>
    </div>
  );
}
