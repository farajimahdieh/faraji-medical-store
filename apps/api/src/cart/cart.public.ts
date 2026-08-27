import { CartItem } from './entities/cart-item.entity';
import { ProductStatus } from '../catalog/entities/product.entity';
import { DiscountCode, DiscountType } from '../coupons/entities/discount-code.entity';
import type { StockStatus } from '../catalog/products/product.public';

export interface PublicCartItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  brand: { name: string; slug: string } | null;
  primaryImage: { url: string; altText: string | null } | null;
  variantId: string;
  size: string;
  quantity: number;
  unitPrice: number | null;
  lineTotal: number | null;
  stockStatus: StockStatus;
  maxQuantity: number | null;
  unavailable: boolean;
  unavailableReason: string | null;
}

export function toPublicCartItem(item: CartItem): PublicCartItem {
  const { product, variant } = item;
  const images = product.images ?? [];
  const primaryImage = images.find((image) => image.isPrimary) ?? images[0] ?? null;

  const productUnavailable =
    product.status !== ProductStatus.ACTIVE || !variant.isActive;
  const insufficientStock = variant.stock !== null && variant.stock < item.quantity;
  const unavailable = productUnavailable || variant.price === null || insufficientStock;

  let unavailableReason: string | null = null;
  if (productUnavailable) {
    unavailableReason = 'این کالا دیگر موجود نیست';
  } else if (variant.price === null) {
    unavailableReason = 'قیمت این کالا هنوز مشخص نشده است';
  } else if (insufficientStock) {
    unavailableReason = `فقط ${variant.stock} عدد از این کالا موجود است`;
  }

  const stockStatus: StockStatus =
    variant.stock === null ? 'unknown' : variant.stock > 0 ? 'in_stock' : 'out_of_stock';

  return {
    id: item.id,
    productId: item.productId,
    productName: product.name,
    productSlug: product.slug,
    brand: product.brand ? { name: product.brand.name, slug: product.brand.slug } : null,
    primaryImage: primaryImage
      ? { url: primaryImage.url, altText: primaryImage.altText }
      : null,
    variantId: item.variantId,
    size: variant.size,
    quantity: item.quantity,
    unitPrice: variant.price,
    lineTotal: variant.price !== null ? variant.price * item.quantity : null,
    stockStatus,
    maxQuantity: variant.stock,
    unavailable,
    unavailableReason,
  };
}

export interface PublicCartCoupon {
  code: string;
  type: DiscountType;
  value: number;
}

export function toPublicCartCoupon(coupon: DiscountCode): PublicCartCoupon {
  return { code: coupon.code, type: coupon.type, value: coupon.value };
}

export interface PublicCartSummary {
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  taxAmount: number;
  totalAmount: number;
  itemCount: number;
}

export interface PublicCart {
  items: PublicCartItem[];
  summary: PublicCartSummary;
  coupon: PublicCartCoupon | null;
  couponError: string | null;
}
