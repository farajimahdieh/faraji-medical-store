// Normalizes a source product URL so the same page always produces the
// same string, regardless of protocol case, trailing slash, or tracking
// query params — used as one of the signals to detect an already-imported
// product on re-import.
export function normalizeSourceUrl(rawUrl: string): string {
  const url = new URL(rawUrl);
  url.protocol = 'https:';
  url.search = '';
  url.hash = '';
  const path =
    url.pathname.length > 1 && url.pathname.endsWith('/')
      ? url.pathname.slice(0, -1)
      : url.pathname;
  return `${url.protocol}//${url.hostname.toLowerCase()}${path}`;
}
