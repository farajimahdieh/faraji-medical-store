import { mediaUrl, type PublicProductDetail } from "./api";

type JsonLd = Record<string, unknown>;

// Google's Product rich result. Prices are stored in Toman; schema.org
// wants an ISO 4217 currency, so they are published as Rial (IRR).
export function buildProductJsonLd(product: PublicProductDetail, pageUrl?: string): JsonLd {
  const prices = product.variants
    .filter((variant) => variant.isActive && variant.price !== null)
    .map((variant) => variant.price! * 10);
  const inStock = product.variants.some(
    (variant) => variant.isActive && variant.price !== null && (variant.stock ?? 0) > 0,
  );

  const jsonLd: JsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images.map((image) => mediaUrl(image.url)),
    description: product.metaDescription ?? product.shortDescription ?? undefined,
    ...(product.sourceCode ? { sku: product.sourceCode } : {}),
    ...(product.brand ? { brand: { "@type": "Brand", name: product.brand.name } } : {}),
  };

  if (prices.length > 0) {
    jsonLd.offers = {
      "@type": "AggregateOffer",
      priceCurrency: "IRR",
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      offerCount: prices.length,
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      ...(pageUrl ? { url: pageUrl } : {}),
    };
  }
  return jsonLd;
}

export function buildFaqJsonLd(faqs: PublicProductDetail["faqs"]): JsonLd | null {
  if (faqs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

// JSON.stringify does not escape "<", so product text containing
// "</script>" could break out of the tag -- escape it (Next's JSON-LD guide).
export function serializeJsonLd(data: JsonLd): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
