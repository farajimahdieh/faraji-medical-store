import { Product } from '../entities/product.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import { ProductImage } from '../entities/product-image.entity';

export interface PublicProductImage {
  url: string;
  thumbnailUrl: string;
  altText: string | null;
  isPrimary: boolean;
}

// Resolves a stored image to its public URL. Admin-uploaded images only
// store an `objectKey` (StorageService resolves it, so a future CDN base
// change is a config change, not a DB rewrite); legacy imported images
// still carry an already-resolved `url`.
export function resolveProductImageUrl(
  image: Pick<ProductImage, 'url' | 'objectKey'>,
  resolveUrl: (key: string) => string,
): string {
  return image.objectKey ? resolveUrl(image.objectKey) : image.url;
}

export interface PublicProductVariant {
  id: string;
  size: string;
  price: number | null;
  stock: number | null;
  isActive: boolean;
}

// "unknown" means no variant has synced with accounting yet — must never
// be presented to a shopper as "out of stock".
export type StockStatus = 'in_stock' | 'out_of_stock' | 'unknown';

export interface PublicPriceDisplay {
  status: 'available' | 'unavailable';
  minPrice: number | null;
  maxPrice: number | null;
}

export interface PublicBrand {
  name: string;
  slug: string;
  website?: string | null;
}

export interface PublicProductListItem {
  id: string;
  slug: string;
  name: string;
  brand: PublicBrand | null;
  primaryImage: PublicProductImage | null;
  sizes: string[];
  // Full variants (not just their sizes) -- needed so "add to cart" from a
  // listing card can resolve a variantId without a second round-trip. The
  // `variants` relation is already loaded for this query for `sizes`/
  // `price`/`stockStatus` below, so this adds no extra query.
  variants: PublicProductVariant[];
  price: PublicPriceDisplay;
  stockStatus: StockStatus;
}

export interface PublicProductCategory {
  name: string;
  slug: string;
  parent: { name: string; slug: string } | null;
}

export interface PublicProductDetail {
  id: string;
  slug: string;
  name: string;
  brand: PublicBrand | null;
  category: PublicProductCategory | null;
  shortDescription: string | null;
  description: string | null;
  features: string[];
  images: PublicProductImage[];
  variants: PublicProductVariant[];
  sourceCode: string | null;
  videoUrl: string | null;
  videoSource: string | null;
  videoTitle: string | null;
}

function toPublicImage(
  image: ProductImage,
  resolveUrl: (key: string) => string,
): PublicProductImage {
  const url = resolveProductImageUrl(image, resolveUrl);
  return {
    url,
    thumbnailUrl: image.thumbnailKey ? resolveUrl(image.thumbnailKey) : url,
    altText: image.altText,
    isPrimary: image.isPrimary,
  };
}

export function toPublicVariant(variant: ProductVariant): PublicProductVariant {
  return {
    id: variant.id,
    size: variant.size,
    price: variant.price,
    stock: variant.stock,
    isActive: variant.isActive,
  };
}

export function resolvePriceDisplay(
  variants: ProductVariant[],
): PublicPriceDisplay {
  const knownPrices = variants
    .map((variant) => variant.price)
    .filter((price): price is number => price !== null);

  if (knownPrices.length === 0) {
    return { status: 'unavailable', minPrice: null, maxPrice: null };
  }
  return {
    status: 'available',
    minPrice: Math.min(...knownPrices),
    maxPrice: Math.max(...knownPrices),
  };
}

export function resolveStockStatus(variants: ProductVariant[]): StockStatus {
  const knownStocks = variants
    .map((variant) => variant.stock)
    .filter((stock): stock is number => stock !== null);

  if (knownStocks.length === 0) return 'unknown';
  return knownStocks.some((stock) => stock > 0) ? 'in_stock' : 'out_of_stock';
}

export function toPublicProductListItem(
  product: Product,
  resolveUrl: (key: string) => string,
): PublicProductListItem {
  const images = product.images ?? [];
  const variants = product.variants ?? [];
  const primaryImage =
    images.find((image) => image.isPrimary) ?? images[0] ?? null;

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand
      ? { name: product.brand.name, slug: product.brand.slug }
      : null,
    primaryImage: primaryImage ? toPublicImage(primaryImage, resolveUrl) : null,
    sizes: variants.map((variant) => variant.size),
    variants: variants.map(toPublicVariant),
    price: resolvePriceDisplay(variants),
    stockStatus: resolveStockStatus(variants),
  };
}

export function toPublicProductDetail(
  product: Product,
  sourceCode: string | null,
  resolveUrl: (key: string) => string,
): PublicProductDetail {
  const images = [...(product.images ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
  const features = [...(product.features ?? [])]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((feature) => feature.text);

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand
      ? {
          name: product.brand.name,
          slug: product.brand.slug,
          website: product.brand.website,
        }
      : null,
    category: product.category
      ? {
          name: product.category.name,
          slug: product.category.slug,
          parent: product.category.parent
            ? {
                name: product.category.parent.name,
                slug: product.category.parent.slug,
              }
            : null,
        }
      : null,
    shortDescription: product.shortDescription,
    description: product.description,
    features,
    images: images.map((image) => toPublicImage(image, resolveUrl)),
    variants: (product.variants ?? []).map(toPublicVariant),
    sourceCode,
    videoUrl: product.videoUrl,
    videoSource: product.videoSource,
    videoTitle: product.videoTitle,
  };
}

export interface PublicFacetOption {
  name: string;
  slug: string;
  count: number;
}

export interface PublicSizeFacetOption {
  size: string;
  count: number;
}

export interface PublicProductFacets {
  subcategories: PublicFacetOption[];
  brands: PublicFacetOption[];
  sizes: PublicSizeFacetOption[];
  // False whenever no in-scope variant has synced price/stock yet — the
  // storefront must hide those filters entirely rather than show one that
  // can never do anything (see product-variant.entity.ts).
  priceFilterAvailable: boolean;
  stockFilterAvailable: boolean;
}
