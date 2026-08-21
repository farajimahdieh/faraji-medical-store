import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { ProductVariantWishlist } from "@/components/catalog/ProductVariantWishlist";
import { VideoSection } from "@/components/catalog/VideoSection";
import { ProductGallery } from "@/components/catalog/ProductGallery";
import { Breadcrumb } from "@/components/catalog/Breadcrumb";
import { ApiError, getProductBySlug } from "@/lib/api";

// Some imported feature lines carry a leading "•" from the source's own
// formatting; the list below already renders its own bullet marker.
function stripLeadingBullet(text: string): string {
  return text.replace(/^[•\-]\s*/, "");
}

// Next hands dynamic segments through without decoding them, and our
// slugs are Persian text (percent-encoded on the wire either way this
// route is reached) — decode once here so getProductBySlug always
// receives, and re-encodes, the plain slug exactly once.
function decodeSlugParam(rawSlug: string): string {
  try {
    return decodeURIComponent(rawSlug);
  } catch {
    return rawSlug;
  }
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">) {
  const { slug: rawSlug } = await params;
  try {
    const product = await getProductBySlug(decodeSlugParam(rawSlug));
    return { title: `${product.name} | تجهیزات پزشکی و آزمایشگاهی فرجی` };
  } catch {
    return {};
  }
}

export default async function ProductDetailPage({
  params,
}: PageProps<"/products/[slug]">) {
  const { slug: rawSlug } = await params;
  const slug = decodeSlugParam(rawSlug);

  let product;
  try {
    product = await getProductBySlug(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  // Breadcrumb shows the product's root category (e.g. "ارتوپدی، حرکتی و
  // توانبخشی") rather than its immediate subcategory, matching the
  // category listing pages' own hierarchy.
  const breadcrumbCategory = product.category
    ? (product.category.parent ?? product.category)
    : null;

  return (
    <Container className="py-10">
      <Breadcrumb
        items={[
          { label: "خانه", href: "/" },
          ...(breadcrumbCategory
            ? [{ label: breadcrumbCategory.name, href: `/categories/${breadcrumbCategory.slug}` }]
            : [{ label: "محصولات", href: "/products" }]),
          { label: product.name },
        ]}
      />

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} productName={product.name} />

        <div className="flex flex-col gap-6">
          <div>
            {product.brand && (
              <p className="text-sm font-medium text-primary">{product.brand.name}</p>
            )}
            <h1 className="mt-1 text-2xl font-bold text-navy">{product.name}</h1>
            {product.category && (
              <p className="mt-1 text-sm text-secondary-text">
                دسته‌بندی: {product.category.name}
              </p>
            )}
            {product.sourceCode && (
              <p className="mt-1 text-xs text-secondary-text">
                کد محصول: {product.sourceCode}
              </p>
            )}
          </div>

          <ProductVariantWishlist
            productId={product.id}
            productName={product.name}
            variants={product.variants}
          />

          {product.shortDescription && (
            <p className="whitespace-pre-line text-sm leading-7 text-secondary-text">
              {product.shortDescription}
            </p>
          )}

          <VideoSection
            url={product.videoUrl}
            source={product.videoSource}
            title={product.videoTitle}
          />

          {product.features.length > 0 && (
            <div>
              <h2 className="mb-2 text-base font-bold text-navy">ویژگی‌ها</h2>
              <ul className="flex flex-col gap-1.5 text-sm leading-6 text-secondary-text">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex gap-2">
                    <span
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                    {stripLeadingBullet(feature)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {product.description && (
            <div>
              <h2 className="mb-2 text-base font-bold text-navy">توضیحات محصول</h2>
              <p className="whitespace-pre-line text-sm leading-7 text-secondary-text">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}
