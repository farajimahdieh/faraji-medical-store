import { TebSanatProduct, SIZE_ATTRIBUTE_TAXONOMY } from './teb-sanat.types';
import {
  sanitizeSourceHtml,
  extractFeaturesFromDescription,
} from './content-sanitizer';
import { normalizeSourceUrl } from './url';
import { classifyProduct, FarajiSubcategory } from './category-map';
import { extractVideoUrl, VideoSource } from './video-extractor';

export interface NormalizedImage {
  sourceUrl: string;
  sortOrder: number;
}

export interface NormalizedProduct {
  sourceProductId: number;
  name: string;
  slug: string;
  sku: string;
  sourceUrl: string;
  shortDescription: string | null;
  description: string | null;
  features: string[];
  images: NormalizedImage[];
  sizes: string[];
  subcategory: FarajiSubcategory;
  videoUrl: string | null;
  videoSource: VideoSource | null;
}

// Unifies the Arabic-script Yeh/Kaf variants some source entries use with
// their standard Persian forms, and collapses stray whitespace. Does not
// change case — Persian has none, and this value is used for display.
export function normalizeProductName(name: string): string {
  return name.replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/\s+/g, ' ').trim();
}

// The "سایز بندی" (sizing) attribute is present on every product observed
// on teb-sanat.com, even single-size items (term "تک سایز"). If a product
// truly has none, this returns [] and the caller must not invent a size.
export function parseSizeTerms(product: TebSanatProduct): string[] {
  const sizeAttribute = product.attributes.find(
    (attribute) => attribute.taxonomy === SIZE_ATTRIBUTE_TAXONOMY,
  );
  if (!sizeAttribute) return [];
  return sizeAttribute.terms.map((term) => term.name);
}

// `discoveredCategoryIds` are the source category ids this product was
// actually found under while crawling (the `?category=` filter that
// returned it). teb-sanat.com's own `product.categories` field is
// unreliable — a meaningful share of products come back with an empty (or
// wrong, e.g. only "جدیدترین محصولات") categories array even though the
// category-filtered listing did return them — so the discovered id(s) take
// priority, with the declared `categories` field only as a secondary signal.
export function normalizeSourceProduct(
  product: TebSanatProduct,
  discoveredCategoryIds: number[],
): NormalizedProduct {
  const name = normalizeProductName(product.name);

  // Video extraction MUST run against the raw HTML, before sanitizing —
  // sanitizeSourceHtml strips iframes/tags and would destroy the evidence.
  const video =
    extractVideoUrl(product.description) ??
    extractVideoUrl(product.short_description);

  const description = sanitizeSourceHtml(product.description) || null;
  const shortDescription =
    sanitizeSourceHtml(product.short_description) || null;

  const categoryIds = Array.from(
    new Set([
      ...discoveredCategoryIds,
      ...product.categories.map((category) => category.id),
    ]),
  );

  return {
    sourceProductId: product.id,
    name,
    slug: decodeURIComponent(product.slug),
    sku: product.sku,
    sourceUrl: normalizeSourceUrl(product.permalink),
    shortDescription,
    description,
    features: description ? extractFeaturesFromDescription(description) : [],
    images: product.images.map((image, index) => ({
      sourceUrl: image.src,
      sortOrder: index,
    })),
    sizes: parseSizeTerms(product),
    subcategory: classifyProduct(categoryIds, name),
    videoUrl: video?.url ?? null,
    videoSource: video?.source ?? null,
  };
}
