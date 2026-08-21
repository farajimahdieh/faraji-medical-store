// Shared shape for the listing filter state that lives in the URL, so
// links/pagination/filters all agree on which params exist and reset page
// to 1 the same way whenever a filter changes.
export interface ListingSearchParams {
  q?: string;
  brand?: string;
  size?: string;
  sort?: string;
  page?: string;
}

// Builds `basePath?...` with `overrides` applied on top of `current`.
// Any key set to `undefined` in `overrides` removes that param. Changing
// anything other than `page` itself resets page to 1.
export function buildListingHref(
  basePath: string,
  current: ListingSearchParams,
  overrides: Partial<ListingSearchParams>,
): string {
  const merged: ListingSearchParams = { ...current, ...overrides };
  if (!("page" in overrides)) {
    merged.page = undefined;
  }

  const search = new URLSearchParams();
  if (merged.q) search.set("q", merged.q);
  if (merged.brand) search.set("brand", merged.brand);
  if (merged.size) search.set("size", merged.size);
  if (merged.sort) search.set("sort", merged.sort);
  if (merged.page && merged.page !== "1") search.set("page", merged.page);

  const qs = search.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
