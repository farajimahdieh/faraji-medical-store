const IRAN_MOBILE_PATTERN = /^(?:\+98|0098|98|0)?(9\d{9})$/;

export function normalizeIranPhone(rawPhone: string): string | null {
  const cleaned = rawPhone.trim().replace(/[\s-]/g, '');
  const match = IRAN_MOBILE_PATTERN.exec(cleaned);

  if (!match) {
    return null;
  }

  return `+98${match[1]}`;
}
