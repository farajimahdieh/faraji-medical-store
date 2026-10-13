// Matches a Holoo product group to a product the site already has (e.g.
// one imported earlier from teb-sanat.com), so importing Holoo never
// creates a duplicate. Pure -- unit-tested in product-match.spec.ts.

import { normalizePersian } from './holoo-sheet';

export interface MatchCandidate {
  id: string;
  name: string;
  slug: string;
  brandSlug: string | null;
}

export type MatchResult =
  | { kind: 'match'; candidate: MatchCandidate; score: number }
  | {
      kind: 'ambiguous';
      options: { candidate: MatchCandidate; score: number }[];
    }
  | { kind: 'none' };

export const TEB_SANAT_BRAND_SLUG = 'teb-o-sanat';
const TEB_SANAT_RE = /طب\s*و\s*صنعت/;
const ACCEPT = 0.85;
const MARGIN = 0.1;
const CONSIDER = 0.75;

export function mentionsTebSanat(name: string): boolean {
  return TEB_SANAT_RE.test(normalizePersian(name));
}

// Comparable form of a product name: no brand phrase, product codes,
// parentheses, filler words or spaces (Holoo and the source catalog space
// compound words differently).
export function matchKey(name: string): string {
  return normalizePersian(name)
    .toLowerCase()
    .replace(TEB_SANAT_RE, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/کد\s*\d+/g, ' ')
    .replace(/(^|\s)(طبی|مدل)(?=\s|$)/g, ' ')
    .replace(/\s+/g, '');
}

function bigrams(text: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (let i = 0; i < text.length - 1; i += 1) {
    const pair = text.slice(i, i + 2);
    counts.set(pair, (counts.get(pair) ?? 0) + 1);
  }
  return counts;
}

// Sørensen–Dice coefficient over character bigrams (0..1).
export function similarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const left = bigrams(a);
  const right = bigrams(b);
  let shared = 0;
  for (const [pair, count] of left) {
    shared += Math.min(count, right.get(pair) ?? 0);
  }
  return (2 * shared) / (a.length - 1 + (b.length - 1));
}

export function matchProduct(
  groupName: string,
  candidates: MatchCandidate[],
): MatchResult {
  // A Teb-o-Sanat item only matches Teb-o-Sanat products and vice versa --
  // "زانوبند پاکسمن" must never land on the Teb-o-Sanat knee brace.
  const isTeb = mentionsTebSanat(groupName);
  const key = matchKey(groupName);
  const scored = candidates
    .filter((c) => (c.brandSlug === TEB_SANAT_BRAND_SLUG) === isTeb)
    .map((candidate) => ({
      candidate,
      score: similarity(key, matchKey(candidate.name)),
    }))
    .filter((entry) => entry.score >= CONSIDER)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return { kind: 'none' };
  const [best, second] = scored;
  // An exact name match wins outright; otherwise the best score must be
  // high and clearly ahead of the runner-up.
  const exactAndUnique = best.score === 1 && (!second || second.score < 1);
  const clearWinner =
    best.score >= ACCEPT && (!second || best.score - second.score >= MARGIN);
  if (exactAndUnique || clearWinner) {
    return { kind: 'match', candidate: best.candidate, score: best.score };
  }
  return { kind: 'ambiguous', options: scored.slice(0, 3) };
}
