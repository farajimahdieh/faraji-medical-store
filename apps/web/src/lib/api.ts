export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// Product image `url`s from the API are storage-relative (e.g.
// "/media/products/..."); this resolves them against the API origin.
export function mediaUrl(path: string): string {
  return `${API_URL}${path}`;
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
  role: 'customer' | 'admin';
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
): Promise<{ user: PublicUser }> {
  return apiFetch('/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify({ firstName, lastName }),
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
