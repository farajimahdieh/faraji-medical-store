import { Order, OrderStatus, PaymentStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { resolveProductImageUrl } from '../catalog/products/product.public';

export interface PublicOrderItem {
  id: string;
  productId: string | null;
  productSlug: string | null;
  productName: string;
  variantSize: string | null;
  sku: string | null;
  primaryImage: { url: string; altText: string | null } | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

function toPublicOrderItem(
  item: OrderItem,
  resolveUrl: (key: string) => string,
): PublicOrderItem {
  const images = item.product?.images ?? [];
  const primaryImage = images.find((image) => image.isPrimary) ?? images[0] ?? null;

  return {
    id: item.id,
    productId: item.productId,
    productSlug: item.product?.slug ?? null,
    productName: item.productName,
    variantSize: item.variantSize,
    sku: item.sku,
    primaryImage: primaryImage
      ? { url: resolveProductImageUrl(primaryImage, resolveUrl), altText: primaryImage.altText }
      : null,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    lineTotal: item.lineTotal,
  };
}

export interface PublicOrderAddress {
  recipientName: string;
  recipientPhone: string;
  province: string;
  city: string;
  addressLine: string;
  postalCode: string;
  buildingNumber: string | null;
  unit: string | null;
}

export interface PublicOrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  itemCount: number;
  totalAmount: number;
  createdAt: Date;
}

export interface PublicOrderDetail extends PublicOrderSummary {
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  taxAmount: number;
  shippingMethod: string | null;
  notes: string | null;
  address: PublicOrderAddress;
  items: PublicOrderItem[];
}

function itemCount(order: Order): number {
  return (order.items ?? []).reduce((sum, item) => sum + item.quantity, 0);
}

export function toPublicOrderSummary(order: Order): PublicOrderSummary {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    itemCount: itemCount(order),
    totalAmount: order.totalAmount,
    createdAt: order.createdAt,
  };
}

export function toPublicOrderDetail(
  order: Order,
  resolveUrl: (key: string) => string,
): PublicOrderDetail {
  return {
    ...toPublicOrderSummary(order),
    subtotal: order.subtotal,
    discountAmount: order.discountAmount,
    shippingAmount: order.shippingAmount,
    taxAmount: order.taxAmount,
    shippingMethod: order.shippingMethod,
    notes: order.notes,
    address: {
      recipientName: order.shippingRecipientName,
      recipientPhone: order.shippingRecipientPhone,
      province: order.shippingProvince,
      city: order.shippingCity,
      addressLine: order.shippingAddressLine,
      postalCode: order.shippingPostalCode,
      buildingNumber: order.shippingBuildingNumber,
      unit: order.shippingUnit,
    },
    items: (order.items ?? []).map((item) => toPublicOrderItem(item, resolveUrl)),
  };
}
