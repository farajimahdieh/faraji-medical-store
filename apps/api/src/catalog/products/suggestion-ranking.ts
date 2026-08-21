// Ranking tiers — lower sorts first. Matches the product spec's ordering:
// exact match, starts-with, whole-word, contains (all against the product
// name), then subcategory match, then brand match, then a fuzzy fallback.
export const RANK_EXACT = 0;
export const RANK_STARTS_WITH = 1;
export const RANK_WHOLE_WORD = 2;
export const RANK_CONTAINS = 3;
export const RANK_SUBCATEGORY = 4;
export const RANK_BRAND = 5;
export const RANK_FUZZY = 6;

// Both arguments must already be normalized (see persian-search.util.ts) —
// this only decides which tier the product name falls into, given it's
// already known to match (via the caller's ILIKE/EXISTS query).
export function rankForProductName(
  normalizedName: string,
  normalizedQuery: string,
): number {
  if (normalizedName === normalizedQuery) return RANK_EXACT;
  if (normalizedName.startsWith(normalizedQuery)) return RANK_STARTS_WITH;
  if (normalizedName.split(/\s+/).includes(normalizedQuery))
    return RANK_WHOLE_WORD;
  return RANK_CONTAINS;
}

// Category/brand names don't get their own starts-with/whole-word/contains
// sub-tiers (per the spec's flat list) — just "exact" if the whole field
// matches the query, otherwise the single tier for that field type.
export function rankForSecondaryField(
  normalizedField: string,
  normalizedQuery: string,
  fieldTier: number,
): number {
  return normalizedField === normalizedQuery ? RANK_EXACT : fieldTier;
}

export interface Ranked<T> {
  rank: number;
  // Secondary sort within a rank tier: shorter/closer names first.
  length: number;
  value: T;
}

export function compareRanked<T>(a: Ranked<T>, b: Ranked<T>): number {
  return a.rank - b.rank || a.length - b.length;
}
