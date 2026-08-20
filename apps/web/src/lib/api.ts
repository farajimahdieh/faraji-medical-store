const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

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
