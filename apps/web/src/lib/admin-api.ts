import {
  API_URL,
  ApiError,
  type OrderStatus,
  type PaymentStatus,
  type PublicOrderDetail,
  type PublicUser,
} from './api';

// Same fetch convention as lib/api.ts (fetch + credentials:'include' +
// ApiError on non-OK), split into its own file since the admin surface is
// large enough on its own.
async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: options.body instanceof FormData ? options.headers : { 'Content-Type': 'application/json', ...options.headers },
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

export function adminLoginPassword(phone: string, password: string): Promise<{ message: string }> {
  return apiFetch('/admin/auth/login-password', { method: 'POST', body: JSON.stringify({ phone, password }) });
}

export function adminLoginVerify(phone: string, code: string): Promise<{ user: PublicUser }> {
  return apiFetch('/admin/auth/login-verify', { method: 'POST', body: JSON.stringify({ phone, code }) });
}

export function requestAdminActivation(phone: string): Promise<{ message: string }> {
  return apiFetch('/admin/auth/activate-request', { method: 'POST', body: JSON.stringify({ phone }) });
}

export function activateAdmin(phone: string, code: string, password: string): Promise<{ user: PublicUser }> {
  return apiFetch('/admin/auth/activate-verify', {
    method: 'POST',
    body: JSON.stringify({ phone, code, password }),
  });
}

export type ProductStatus = 'draft' | 'incomplete' | 'needs_review' | 'active' | 'hidden' | 'archived';

export interface AdminProductImage {
  id: string;
  url: string;
  thumbnailKey: string | null;
  altText: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

export interface AdminProductListItem {
  id: string;
  name: string;
  slug: string;
  status: ProductStatus;
  rejectionReason: string | null;
  brand: { id: string; name: string } | null;
  images: AdminProductImage[];
}

export interface AdminProductDetail extends AdminProductListItem {
  categoryId: string | null;
  brandId: string | null;
  shortDescription: string | null;
  description: string | null;
  isFeatured: boolean;
}

export interface AdminProductListResponse {
  items: AdminProductListItem[];
  total: number;
  page: number;
  limit: number;
}

export function listAdminProducts(
  params: { q?: string; status?: ProductStatus; page?: number; limit?: number } = {},
): Promise<AdminProductListResponse> {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.status) search.set('status', params.status);
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  const qs = search.toString();
  return apiFetch(`/admin/products${qs ? `?${qs}` : ''}`);
}

export function getAdminProduct(id: string): Promise<AdminProductDetail> {
  return apiFetch(`/admin/products/${id}`);
}

export interface ProductInput {
  name?: string;
  slug?: string;
  brandId?: string | null;
  categoryId?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  isFeatured?: boolean;
}

export function createAdminProduct(input: ProductInput): Promise<AdminProductDetail> {
  return apiFetch('/admin/products', { method: 'POST', body: JSON.stringify(input) });
}

export function updateAdminProduct(id: string, input: ProductInput): Promise<AdminProductDetail> {
  return apiFetch(`/admin/products/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

// Moderation workflow: a product is born pending review (draft) and only
// leaves that queue via one of these two actions.
export function listPendingProducts(): Promise<AdminProductListItem[]> {
  return apiFetch('/admin/products/pending');
}

export function approveProduct(id: string): Promise<AdminProductDetail> {
  return apiFetch(`/admin/products/${id}/approve`, { method: 'PATCH' });
}

export function rejectProduct(id: string, reason: string): Promise<AdminProductDetail> {
  return apiFetch(`/admin/products/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ reason }) });
}

export function uploadProductImages(productId: string, files: File[]): Promise<AdminProductImage[]> {
  const form = new FormData();
  files.forEach((file) => form.append('files', file));
  return apiFetch(`/admin/products/${productId}/images`, { method: 'POST', body: form });
}

export function replaceProductImage(productId: string, imageId: string, file: File): Promise<AdminProductImage> {
  const form = new FormData();
  form.append('file', file);
  return apiFetch(`/admin/products/${productId}/images/${imageId}/replace`, { method: 'POST', body: form });
}

export function updateProductImage(
  productId: string,
  imageId: string,
  input: { altText?: string; isPrimary?: boolean },
): Promise<AdminProductImage> {
  return apiFetch(`/admin/products/${productId}/images/${imageId}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export function reorderProductImages(productId: string, orderedImageIds: string[]): Promise<void> {
  return apiFetch(`/admin/products/${productId}/images/reorder`, {
    method: 'PATCH',
    body: JSON.stringify({ orderedImageIds }),
  });
}

export function deleteProductImage(productId: string, imageId: string): Promise<void> {
  return apiFetch(`/admin/products/${productId}/images/${imageId}`, { method: 'DELETE' });
}

export interface AdminOrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  itemCount: number;
  totalAmount: number;
  createdAt: string;
}

export interface AdminOrderListResponse {
  items: AdminOrderSummary[];
  total: number;
  page: number;
  limit: number;
}

export function listAdminOrders(params: { page?: number; limit?: number } = {}): Promise<AdminOrderListResponse> {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  const qs = search.toString();
  return apiFetch(`/admin/orders${qs ? `?${qs}` : ''}`);
}

export function getAdminOrder(id: string): Promise<PublicOrderDetail> {
  return apiFetch(`/admin/orders/${id}`);
}

export function updateAdminOrderStatus(
  id: string,
  input: { status?: OrderStatus; paymentStatus?: PaymentStatus },
): Promise<PublicOrderDetail> {
  return apiFetch(`/admin/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export interface AdminAccount {
  id: string;
  phone: string;
  firstName: string | null;
  lastName: string | null;
  role: 'admin' | 'super_admin';
  isActive: boolean;
  activatedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export function listAdmins(): Promise<AdminAccount[]> {
  return apiFetch('/admin/admins');
}

export function createAdmin(input: {
  phone: string;
  firstName: string;
  lastName: string;
  role?: 'admin' | 'super_admin';
}): Promise<AdminAccount> {
  return apiFetch('/admin/admins', { method: 'POST', body: JSON.stringify(input) });
}

export function setAdminActive(id: string, active: boolean): Promise<AdminAccount> {
  return apiFetch(`/admin/admins/${id}/${active ? 'enable' : 'disable'}`, { method: 'PATCH' });
}

export function setAdminRole(id: string, role: 'admin' | 'super_admin'): Promise<AdminAccount> {
  return apiFetch(`/admin/admins/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) });
}

export type CouponAudienceType =
  | 'all'
  | 'specific_users'
  | 'no_orders_ever'
  | 'no_orders_in_months'
  | 'min_orders'
  | 'min_spend';

export interface AdminCoupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed_amount';
  value: number;
  startsAt: string | null;
  expiresAt: string | null;
  usageLimit: number | null;
  usagePerUser: number | null;
  minimumOrderAmount: number | null;
  maxDiscountAmount: number | null;
  isActive: boolean;
  audienceType: CouponAudienceType;
  audienceMonths: number | null;
  audienceMinOrders: number | null;
  audienceMinSpend: number | null;
  internalReason: string | null;
  campaignName: string | null;
  createdAt: string;
}

export interface CouponInput {
  code?: string;
  type?: 'percentage' | 'fixed_amount';
  value?: number;
  startsAt?: string;
  expiresAt?: string;
  usageLimit?: number;
  usagePerUser?: number;
  minimumOrderAmount?: number;
  maxDiscountAmount?: number;
  isActive?: boolean;
  audienceType?: CouponAudienceType;
  audienceMonths?: number;
  audienceMinOrders?: number;
  audienceMinSpend?: number;
  audienceUserIds?: string[];
  internalReason?: string;
  campaignName?: string;
}

export function listCoupons(): Promise<AdminCoupon[]> {
  return apiFetch('/admin/coupons');
}

export function getCoupon(id: string): Promise<AdminCoupon> {
  return apiFetch(`/admin/coupons/${id}`);
}

export function createCoupon(input: CouponInput): Promise<AdminCoupon> {
  return apiFetch('/admin/coupons', { method: 'POST', body: JSON.stringify(input) });
}

export function updateCoupon(id: string, input: CouponInput): Promise<AdminCoupon> {
  return apiFetch(`/admin/coupons/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export interface AuditLogEntry {
  id: string;
  actorAdminId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export function listAuditLogs(params: { page?: number; limit?: number } = {}): Promise<{
  items: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
}> {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  const qs = search.toString();
  return apiFetch(`/admin/audit-logs${qs ? `?${qs}` : ''}`);
}

export interface SiteContentItem {
  id: string;
  key: string;
  title: string;
  body: string;
  updatedAt: string;
}

export function listContent(): Promise<SiteContentItem[]> {
  return apiFetch('/admin/content');
}

export function getContent(key: string): Promise<SiteContentItem> {
  return apiFetch(`/admin/content/${key}`);
}

export function updateContent(key: string, input: { title: string; body: string }): Promise<SiteContentItem> {
  return apiFetch(`/admin/content/${key}`, { method: 'PATCH', body: JSON.stringify(input) });
}
