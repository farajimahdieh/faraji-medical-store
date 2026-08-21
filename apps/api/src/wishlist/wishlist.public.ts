import { WishlistItem } from './entities/wishlist-item.entity';
import {
  PublicPriceDisplay,
  resolvePriceDisplay,
  resolveStockStatus,
  StockStatus,
} from '../catalog/products/product.public';

export interface PublicWishlistBrand {
  name: string;
  slug: string;
}

export interface PublicWishlistImage {
  url: string;
  altText: string | null;
}

export interface PublicWishlistItem {
  wishlistItemId: string;
  productId: string;
  productName: string;
  productSlug: string;
  brand: PublicWishlistBrand | null;
  primaryImage: PublicWishlistImage | null;
  variantId: string | null;
  size: string | null;
  // The item's own variant when one was chosen, otherwise the range/status
  // across all of the product's variants — same shape the product list/
  // detail endpoints already use, so the frontend can reuse one formatter.
  price: PublicPriceDisplay;
  stockStatus: StockStatus;
  note: string | null;
  createdAt: Date;
}

export function toPublicWishlistItem(item: WishlistItem): PublicWishlistItem {
  const images = item.product.images ?? [];
  const primaryImage =
    images.find((image) => image.isPrimary) ?? images[0] ?? null;
  const priceStockVariants = item.variant
    ? [item.variant]
    : (item.product.variants ?? []);

  return {
    wishlistItemId: item.id,
    productId: item.productId,
    productName: item.product.name,
    productSlug: item.product.slug,
    brand: item.product.brand
      ? { name: item.product.brand.name, slug: item.product.brand.slug }
      : null,
    primaryImage: primaryImage
      ? { url: primaryImage.url, altText: primaryImage.altText }
      : null,
    variantId: item.variantId,
    size: item.variant?.size ?? null,
    price: resolvePriceDisplay(priceStockVariants),
    stockStatus: resolveStockStatus(priceStockVariants),
    note: item.note,
    createdAt: item.createdAt,
  };
}

export interface PublicWishlistListResponse {
  items: PublicWishlistItem[];
  total: number;
  page: number;
  limit: number;
}
