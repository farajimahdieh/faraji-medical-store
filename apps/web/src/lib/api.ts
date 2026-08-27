export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// Product image `url`s from the API are usually storage-relative (e.g.
// "/media/products/..."), resolved against the API origin -- but
// admin-uploaded images can carry an already-absolute URL (Arvan/CDN), so
// this passes those through unchanged.
export function mediaUrl(path: string): string {
  return /^https?:\/\//.test(path) ? path : `${API_URL}${path}`;
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body
        ? String((body as { message: unknown }).message)
        : 'خطایی رخ داد';
    throw new ApiError(response.status, message);
  }

  return body as T;
}

export interface PublicUser {
  id: string;
  phone: string;
  firstName: string | null;
  lastName: string | null;
  birthDate: string | null;
  role: 'customer' | 'admin' | 'super_admin';
}

export function requestOtp(phone: string): Promise<{ message: string }> {
  return apiFetch('/auth/otp/request', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
}

export function verifyOtp(
  phone: string,
  code: string,
): Promise<{ user: PublicUser; isNewUser: boolean }> {
  return apiFetch('/auth/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ phone, code }),
  });
}

export function completeProfile(
  firstName: string,
  lastName: string,
  birthDate?: string,
): Promise<{ user: PublicUser }> {
  return apiFetch('/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify({ firstName, lastName, birthDate }),
  });
}

export function getMe(): Promise<{ user: PublicUser }> {
  return apiFetch('/auth/me');
}

export function logout(): Promise<void> {
  return apiFetch('/auth/logout', { method: 'POST' });
}

export interface PublicProductImage {
  url: string;
  altText: string | null;
  isPrimary: boolean;
}

export interface PublicProductVariant {
  id: string;
  size: string;
  price: number | null;
  stock: number | null;
  isActive: boolean;
}

// "unknown" means no variant has synced with accounting yet — never treat
// this as "out of stock".
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

export interface PublicProductListResponse {
  items: PublicProductListItem[];
  total: number;
  page: number;
  limit: number;
}

export type ProductSortOption = 'newest' | 'name';

export interface ListProductsParams {
  category?: string;
  q?: string;
  brand?: string;
  size?: string;
  sort?: ProductSortOption;
  page?: number;
  limit?: number;
}

export function listProducts(
  params: ListProductsParams = {},
): Promise<PublicProductListResponse> {
  const search = new URLSearchParams();
  if (params.category) search.set('category', params.category);
  if (params.q) search.set('q', params.q);
  if (params.brand) search.set('brand', params.brand);
  if (params.size) search.set('size', params.size);
  if (params.sort) search.set('sort', params.sort);
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  const qs = search.toString();
  return apiFetch(`/products${qs ? `?${qs}` : ''}`);
}

export function getProductBySlug(slug: string): Promise<PublicProductDetail> {
  return apiFetch(`/products/${encodeURIComponent(slug)}`);
}

export interface PublicCategory {
  id: string;
  name: string;
  slug: string;
  parent: { name: string; slug: string } | null;
}

export function listCategories(): Promise<PublicCategory[]> {
  return apiFetch('/categories');
}

export function getCategoryBySlug(slug: string): Promise<PublicCategory> {
  return apiFetch(`/categories/${encodeURIComponent(slug)}`);
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
  priceFilterAvailable: boolean;
  stockFilterAvailable: boolean;
}

export function getProductFacets(
  params: { category?: string; q?: string } = {},
): Promise<PublicProductFacets> {
  const search = new URLSearchParams();
  if (params.category) search.set('category', params.category);
  if (params.q) search.set('q', params.q);
  const qs = search.toString();
  return apiFetch(`/products/facets${qs ? `?${qs}` : ''}`);
}

export interface PublicProductSuggestion {
  type: 'product';
  id: string;
  label: string;
  slug: string;
  brand: string | null;
  image: string | null;
}

export interface PublicSubcategorySuggestion {
  type: 'subcategory';
  label: string;
  slug: string;
}

export interface PublicBrandSuggestion {
  type: 'brand';
  label: string;
  slug: string;
}

export type PublicSuggestion =
  | PublicProductSuggestion
  | PublicSubcategorySuggestion
  | PublicBrandSuggestion;

export function getProductSuggestions(
  q: string,
  limit = 6,
  options: { signal?: AbortSignal } = {},
): Promise<{ suggestions: PublicSuggestion[] }> {
  const search = new URLSearchParams({ q, limit: String(limit) });
  return apiFetch(`/products/suggestions?${search.toString()}`, {
    signal: options.signal,
  });
}

export interface PublicWishlistItem {
  wishlistItemId: string;
  productId: string;
  productName: string;
  productSlug: string;
  brand: PublicBrand | null;
  primaryImage: PublicProductImage | null;
  variantId: string | null;
  size: string | null;
  price: PublicPriceDisplay;
  stockStatus: StockStatus;
  variants: PublicProductVariant[];
  note: string | null;
  createdAt: string;
}

export interface PublicWishlistListResponse {
  items: PublicWishlistItem[];
  total: number;
  page: number;
  limit: number;
}

export function addToWishlist(
  productId: string,
  variantId?: string | null,
): Promise<PublicWishlistItem> {
  return apiFetch('/wishlist', {
    method: 'POST',
    body: JSON.stringify({ productId, variantId: variantId ?? undefined }),
  });
}

export function listWishlist(
  params: { page?: number; limit?: number } = {},
): Promise<PublicWishlistListResponse> {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  const qs = search.toString();
  return apiFetch(`/wishlist${qs ? `?${qs}` : ''}`);
}

export function getWishlistCount(): Promise<{ count: number }> {
  return apiFetch('/wishlist/count');
}

export function checkWishlist(
  productId: string,
  variantId?: string | null,
): Promise<{ inWishlist: boolean; wishlistItemId: string | null }> {
  const search = new URLSearchParams({ productId });
  if (variantId) search.set('variantId', variantId);
  return apiFetch(`/wishlist/check?${search.toString()}`);
}

export function updateWishlistNote(
  wishlistItemId: string,
  note: string | null,
): Promise<PublicWishlistItem> {
  return apiFetch(`/wishlist/${encodeURIComponent(wishlistItemId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ note }),
  });
}

export function removeFromWishlist(wishlistItemId: string): Promise<void> {
  return apiFetch(`/wishlist/${encodeURIComponent(wishlistItemId)}`, {
    method: 'DELETE',
  });
}

export interface PublicUserAddress {
  id: string;
  title: string;
  recipientName: string;
  recipientPhone: string;
  province: string;
  city: string;
  addressLine: string;
  postalCode: string;
  buildingNumber: string | null;
  unit: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AddressInput {
  title: string;
  recipientName: string;
  recipientPhone: string;
  province: string;
  city: string;
  addressLine: string;
  postalCode: string;
  buildingNumber?: string | null;
  unit?: string | null;
  isDefault?: boolean;
}

export function listAddresses(): Promise<PublicUserAddress[]> {
  return apiFetch('/addresses');
}

export function createAddress(input: AddressInput): Promise<PublicUserAddress> {
  return apiFetch('/addresses', { method: 'POST', body: JSON.stringify(input) });
}

export function updateAddress(
  id: string,
  input: Partial<AddressInput>,
): Promise<PublicUserAddress> {
  return apiFetch(`/addresses/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function setDefaultAddress(id: string): Promise<PublicUserAddress> {
  return apiFetch(`/addresses/${encodeURIComponent(id)}/default`, { method: 'PATCH' });
}

export function deleteAddress(id: string): Promise<void> {
  return apiFetch(`/addresses/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export type DiscountType = 'percentage' | 'fixed_amount';

export interface PublicDiscountCode {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  startsAt: string | null;
  expiresAt: string | null;
  minimumOrderAmount: number | null;
  isPersonal: boolean;
}

export function listMyCoupons(): Promise<PublicDiscountCode[]> {
  return apiFetch('/coupons/mine');
}

export interface PublicCartItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  brand: PublicBrand | null;
  primaryImage: PublicProductImage | null;
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

export interface PublicCartCoupon {
  code: string;
  type: DiscountType;
  value: number;
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

export function getCart(): Promise<PublicCart> {
  return apiFetch('/cart');
}

export function addCartItem(variantId: string, quantity = 1): Promise<PublicCart> {
  return apiFetch('/cart/items', { method: 'POST', body: JSON.stringify({ variantId, quantity }) });
}

export function updateCartItem(itemId: string, quantity: number): Promise<PublicCart> {
  return apiFetch(`/cart/items/${encodeURIComponent(itemId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ quantity }),
  });
}

export function removeCartItem(itemId: string): Promise<PublicCart> {
  return apiFetch(`/cart/items/${encodeURIComponent(itemId)}`, { method: 'DELETE' });
}

export function clearCart(): Promise<PublicCart> {
  return apiFetch('/cart', { method: 'DELETE' });
}

export function applyCoupon(code: string): Promise<PublicCart> {
  return apiFetch('/cart/coupon', { method: 'POST', body: JSON.stringify({ code }) });
}

export function removeCoupon(): Promise<PublicCart> {
  return apiFetch('/cart/coupon', { method: 'DELETE' });
}

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface PublicOrderItem {
  id: string;
  productId: string | null;
  productSlug: string | null;
  productName: string;
  variantSize: string | null;
  sku: string | null;
  primaryImage: PublicProductImage | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
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
  createdAt: string;
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

export interface PublicOrderListResponse {
  items: PublicOrderSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateOrderInput {
  addressId: string;
  shippingMethod?: string;
  notes?: string;
}

export function createOrder(input: CreateOrderInput): Promise<PublicOrderDetail> {
  return apiFetch('/orders', { method: 'POST', body: JSON.stringify(input) });
}

export function listOrders(
  params: { page?: number; limit?: number } = {},
): Promise<PublicOrderListResponse> {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  const qs = search.toString();
  return apiFetch(`/orders${qs ? `?${qs}` : ''}`);
}

export function getOrder(id: string): Promise<PublicOrderDetail> {
  return apiFetch(`/orders/${encodeURIComponent(id)}`);
}

export interface ReorderResult {
  addedCount: number;
  skipped: { productName: string; reason: string }[];
}

export function reorderOrder(id: string): Promise<ReorderResult> {
  return apiFetch(`/orders/${encodeURIComponent(id)}/reorder`, { method: 'POST' });
}

export interface PublicRecentlyViewedItem extends PublicProductListItem {
  viewedAt: string;
}

export function recordRecentlyViewed(productId: string): Promise<void> {
  return apiFetch(`/recently-viewed/${encodeURIComponent(productId)}`, { method: 'POST' });
}

export function listRecentlyViewed(limit = 10): Promise<PublicRecentlyViewedItem[]> {
  return apiFetch(`/recently-viewed?limit=${limit}`);
}

export function clearRecentlyViewed(): Promise<void> {
  return apiFetch('/recently-viewed', { method: 'DELETE' });
}

export interface PublicSearchHistoryItem {
  id: string;
  query: string;
  searchedAt: string;
}

// Suffixed "Remote" throughout -- @/lib/search-history.ts already owns the
// (unprefixed) guest/localStorage names, and SearchBar needs to import both.
export function addSearchHistoryRemote(query: string): Promise<PublicSearchHistoryItem> {
  return apiFetch('/search-history', { method: 'POST', body: JSON.stringify({ query }) });
}

export function listSearchHistoryRemote(limit = 5): Promise<PublicSearchHistoryItem[]> {
  return apiFetch(`/search-history?limit=${limit}`);
}

export function removeSearchHistoryRemote(id: string): Promise<void> {
  return apiFetch(`/search-history/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export function clearSearchHistoryRemote(): Promise<void> {
  return apiFetch('/search-history', { method: 'DELETE' });
}
