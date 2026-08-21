import { Container } from "@/components/ui/Container";
import { ProductCard } from "./ProductCard";
import { Pagination } from "./Pagination";
import { SearchInput } from "./SearchInput";
import { SortSelect } from "./SortSelect";
import { FilterGroup } from "./FilterGroup";
import { SubcategoryFilterGroup } from "./SubcategoryFilterGroup";
import { ActiveFilterChips, type ActiveFilterChip } from "./ActiveFilterChips";
import { MobileFiltersSheet, type SheetLinkOption } from "./MobileFiltersSheet";
import { EmptyState } from "./EmptyState";
import { Breadcrumb, type BreadcrumbItem } from "./Breadcrumb";
import {
  listProducts,
  getProductFacets,
  type ProductSortOption,
} from "@/lib/api";
import { buildListingHref, type ListingSearchParams } from "@/lib/query-params";

const PAGE_SIZE = 24;

export async function ProductListing({
  title,
  breadcrumb,
  categorySlug,
  basePath,
  searchPlaceholder,
  rawSearchParams,
}: {
  title: string;
  breadcrumb: BreadcrumbItem[];
  categorySlug?: string;
  basePath: string;
  searchPlaceholder: string;
  rawSearchParams: Record<string, string | string[] | undefined>;
}) {
  const q = firstString(rawSearchParams.q);
  const brand = firstString(rawSearchParams.brand);
  const size = firstString(rawSearchParams.size);
  const sortParam = firstString(rawSearchParams.sort);
  const sort: ProductSortOption = sortParam === "name" ? "name" : "newest";
  const pageParam = firstString(rawSearchParams.page);
  const page = pageParam ? Math.max(1, Number(pageParam) || 1) : 1;

  const currentParams: ListingSearchParams = {
    q,
    brand,
    size,
    sort: sortParam,
    page: String(page),
  };

  const [{ items, total, limit }, facets] = await Promise.all([
    listProducts({ category: categorySlug, q, brand, size, sort, page, limit: PAGE_SIZE }),
    getProductFacets({ category: categorySlug, q }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasActiveFilters = Boolean(q || brand || size);

  const chips: ActiveFilterChip[] = [];
  if (q) chips.push({ key: "q", label: q });
  if (brand) {
    const match = facets.brands.find((option) => option.slug === brand);
    chips.push({ key: "brand", label: match?.name ?? brand });
  }
  if (size) chips.push({ key: "size", label: size });

  const clearHref = buildListingHref(basePath, currentParams, {
    q: undefined,
    brand: undefined,
    size: undefined,
  });

  const brandOptions = facets.brands.map((option) => ({
    label: option.name,
    value: option.slug,
    count: option.count,
  }));
  const sizeOptions = facets.sizes.map((option) => ({
    label: option.size,
    value: option.size,
    count: option.count,
  }));

  const subcategoryQuery = new URLSearchParams();
  if (q) subcategoryQuery.set("q", q);
  if (sortParam) subcategoryQuery.set("sort", sortParam);
  const subcategoryQs = subcategoryQuery.toString();
  const subcategoryLinks: SheetLinkOption[] = facets.subcategories.map((option) => ({
    label: option.name,
    href: subcategoryQs
      ? `/categories/${option.slug}?${subcategoryQs}`
      : `/categories/${option.slug}`,
    active: option.slug === categorySlug,
    count: option.count,
  }));

  const hasFilterOptions =
    facets.subcategories.length > 0 || brandOptions.length > 0 || sizeOptions.length > 0;

  return (
    <Container className="py-10">
      <Breadcrumb items={breadcrumb} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">{title}</h1>
          <p className="mt-1 text-sm text-secondary-text">
            {total.toLocaleString("fa-IR")} محصول
            {hasActiveFilters ? " پیدا شد" : ""}
          </p>
        </div>
        <SearchInput placeholder={searchPlaceholder} className="w-full sm:max-w-xs" />
      </div>

      <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-start">
        {hasFilterOptions && (
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="flex flex-col gap-5 rounded-2xl border border-border bg-white p-5">
            <SubcategoryFilterGroup
              options={facets.subcategories}
              activeSlug={categorySlug}
              searchParams={currentParams}
            />
            <FilterGroup
              title="برند"
              paramKey="brand"
              options={brandOptions}
              basePath={basePath}
              searchParams={currentParams}
              activeValue={brand}
            />
            <FilterGroup
              title="سایز"
              paramKey="size"
              options={sizeOptions}
              basePath={basePath}
              searchParams={currentParams}
              activeValue={size}
            />
          </div>
        </aside>
        )}

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between gap-3">
            {hasFilterOptions ? (
              <MobileFiltersSheet
                subcategoryLinks={subcategoryLinks}
                brandOptions={brandOptions}
                sizeOptions={sizeOptions}
              />
            ) : (
              <span />
            )}
            <SortSelect />
          </div>

          <ActiveFilterChips chips={chips} basePath={basePath} searchParams={currentParams} />

          {items.length === 0 ? (
            <EmptyState clearHref={clearHref} />
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <Pagination
            page={page}
            totalPages={totalPages}
            basePath={basePath}
            searchParams={currentParams}
          />
        </div>
      </div>
    </Container>
  );
}

function firstString(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw ? raw : undefined;
}
