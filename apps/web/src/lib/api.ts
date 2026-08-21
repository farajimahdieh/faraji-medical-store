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

export interface PublicProductDetail {
  id: string;
  slug: string;
  name: string;
  brand: PublicBrand | null;
  category: { name: string; slug: string } | null;
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

export function listProducts(
  params: { category?: string; page?: number; limit?: number } = {},
): Promise<PublicProductListResponse> {
  const search = new URLSearchParams();
  if (params.category) search.set('category', params.category);
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  const qs = search.toString();
  return apiFetch(`/products${qs ? `?${qs}` : ''}`);
}

export function getProductBySlug(slug: string): Promise<PublicProductDetail> {
  return apiFetch(`/products/${encodeURIComponent(slug)}`);
}
