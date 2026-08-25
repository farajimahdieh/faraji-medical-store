// Shared "return to where the user was" helper for the login/signup flow.
//
// A returnTo value must be a same-site path: it starts with exactly one "/"
// (never "//" or "/\", both of which browsers can treat as a protocol-relative
// external URL) and never contains "://". Anything else falls back to
// "/account" -- the same destination a direct (non-contextual) login lands on.
const SAFE_INTERNAL_PATH = /^\/(?!\/|\\)/;

export const DEFAULT_RETURN_TO = "/account";

export function getSafeReturnTo(value: string | null | undefined): string {
  if (!value) return DEFAULT_RETURN_TO;
  const trimmed = value.trim();
  if (!SAFE_INTERNAL_PATH.test(trimmed) || trimmed.includes("://")) {
    return DEFAULT_RETURN_TO;
  }
  return trimmed;
}

/** Current pathname + query string, as a single path suitable for returnTo. */
export function currentPathWithQuery(pathname: string, searchParams: URLSearchParams): string {
  const qs = searchParams.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function loginHrefWithReturnTo(currentPath: string): string {
  return `/login?returnTo=${encodeURIComponent(currentPath)}`;
}
