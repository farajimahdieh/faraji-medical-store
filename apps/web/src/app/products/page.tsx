import { ProductListing } from "@/components/catalog/ProductListing";

export const metadata = {
  title: "محصولات | تجهیزات پزشکی و آزمایشگاهی فرجی",
  description: "مشاهده همه محصولات فروشگاه تجهیزات پزشکی و آزمایشگاهی فرجی.",
};

export default async function ProductsPage({
  searchParams,
}: PageProps<"/products">) {
  const resolvedSearchParams = await searchParams;

  return (
    <ProductListing
      title="محصولات"
      breadcrumb={[{ label: "خانه", href: "/" }, { label: "محصولات" }]}
      basePath="/products"
      searchPlaceholder="جستجو در محصولات..."
      rawSearchParams={resolvedSearchParams}
    />
  );
}
