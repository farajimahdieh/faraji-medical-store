import { notFound } from "next/navigation";
import { ProductListing } from "@/components/catalog/ProductListing";
import { ApiError, getCategoryBySlug } from "@/lib/api";

// The store's flagship category right now — the only one with real,
// database-backed products (see docs/project-blueprint.md). Gets bespoke
// SEO copy; other category pages fall back to a generated title/description.
const ORTHOPEDIC_ROOT_SLUG = "orthopedic-mobility-rehab";

export async function generateMetadata({
  params,
}: PageProps<"/categories/[slug]">) {
  const { slug } = await params;
  try {
    const category = await getCategoryBySlug(slug);
    if (slug === ORTHOPEDIC_ROOT_SLUG) {
      return {
        title: "تجهیزات ارتوپدی، حرکتی و توانبخشی | فرجی",
        description:
          "مشاهده محصولات ارتوپدی و توانبخشی فروشگاه فرجی شامل محصولات طب و صنعت، کمربند طبی، زانوبند، مچ‌بند و سایر تجهیزات.",
      };
    }
    return {
      title: `${category.name} | تجهیزات پزشکی و آزمایشگاهی فرجی`,
      description: `مشاهده محصولات ${category.name} در فروشگاه تجهیزات پزشکی و آزمایشگاهی فرجی.`,
    };
  } catch {
    return {};
  }
}

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps<"/categories/[slug]">) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;

  let category;
  try {
    category = await getCategoryBySlug(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return (
    <ProductListing
      title={category.name}
      breadcrumb={[
        { label: "خانه", href: "/" },
        { label: "دسته‌بندی‌ها" },
        ...(category.parent
          ? [{ label: category.parent.name, href: `/categories/${category.parent.slug}` }]
          : []),
        { label: category.name },
      ]}
      categorySlug={slug}
      basePath={`/categories/${slug}`}
      searchPlaceholder={
        slug === ORTHOPEDIC_ROOT_SLUG
          ? "جستجو در محصولات ارتوپدی..."
          : `جستجو در محصولات ${category.name}...`
      }
      rawSearchParams={resolvedSearchParams}
    />
  );
}
