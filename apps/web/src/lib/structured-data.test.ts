import { describe, expect, it } from "vitest";
import type { PublicProductDetail } from "./api";
import { buildFaqJsonLd, buildProductJsonLd, serializeJsonLd } from "./structured-data";

function product(overrides?: Partial<PublicProductDetail>): PublicProductDetail {
  return {
    id: "p1",
    slug: "p1",
    name: "پانسمان هیدروکلوئید",
    brand: { name: "هارتمن", slug: "hartmann" },
    category: null,
    shortDescription: "کوتاه",
    description: null,
    features: [],
    specifications: [],
    faqs: [],
    metaTitle: null,
    metaDescription: "توضیح متا",
    images: [{ url: "https://cdn.example/a.webp", altText: null, isPrimary: true }],
    variants: [
      { id: "v1", size: "10×10", price: 600_000, stock: 0, isActive: true },
      { id: "v2", size: "20×20", price: 1_200_000, stock: 4, isActive: true },
      { id: "v3", size: "30×30", price: null, stock: 9, isActive: true },
    ],
    sourceCode: "113150020",
    videoUrl: null,
    videoSource: null,
    videoTitle: null,
    ...overrides,
  };
}

describe("buildProductJsonLd", () => {
  it("publishes the price range in Rial with stock availability", () => {
    const jsonLd = buildProductJsonLd(product(), "https://shop.example/products/p1");
    expect(jsonLd).toMatchObject({
      "@type": "Product",
      sku: "113150020",
      description: "توضیح متا",
      brand: { name: "هارتمن" },
      offers: {
        priceCurrency: "IRR",
        lowPrice: 6_000_000,
        highPrice: 12_000_000,
        offerCount: 2,
        availability: "https://schema.org/InStock",
        url: "https://shop.example/products/p1",
      },
    });
  });

  it("omits offers when no variant has a price yet", () => {
    const jsonLd = buildProductJsonLd(
      product({ variants: [{ id: "v", size: "x", price: null, stock: null, isActive: true }] }),
    );
    expect(jsonLd.offers).toBeUndefined();
  });
});

describe("buildFaqJsonLd", () => {
  it("returns null without FAQs and a FAQPage otherwise", () => {
    expect(buildFaqJsonLd([])).toBeNull();
    expect(buildFaqJsonLd([{ question: "q", answer: "a" }])).toMatchObject({
      "@type": "FAQPage",
      mainEntity: [{ name: "q", acceptedAnswer: { text: "a" } }],
    });
  });
});

describe("serializeJsonLd", () => {
  it("cannot be used to close the script tag", () => {
    expect(serializeJsonLd({ name: "</script><script>x" })).not.toContain("</script>");
  });
});
