// Plain YYYY-MM-DD date strings only, on purpose -- the backend stores
// birthDate as a date-only value, and any round-trip through a JS Date
// object (e.g. toISOString(), which is UTC-based) can shift the day
// depending on the user's timezone. Read using local getters, compare as
// strings (ISO dates sort correctly lexicographically).

export function todayLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isFutureDateString(value: string): boolean {
  return value > todayLocalDateString();
}
