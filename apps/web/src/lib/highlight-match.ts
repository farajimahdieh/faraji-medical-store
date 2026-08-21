export interface HighlightSegment {
  text: string;
  match: boolean;
}

const SPECIAL_CHARS = /[.*+?^${}()|[\]\\]/g;

// Builds a regex pattern that treats ی/ي, ک/ك and space/ZWNJ as
// interchangeable, so the match highlighted in the (already-clean) label
// text lines up even when the user's query uses a different Unicode form
// (mirrors the server-side normalization in persian-search.util.ts,
// without needing to re-map indices between normalized/original strings).
function buildFuzzyPattern(query: string): string {
  return query
    .split('')
    .map((char) => {
      if (char === 'ی' || char === 'ي') return '[یي]';
      if (char === 'ک' || char === 'ك') return '[کك]';
      if (char === ' ' || char === '‌') return '[ ‌]+';
      return char.replace(SPECIAL_CHARS, '\\$&');
    })
    .join('');
}

// Splits `text` into segments around the first place `query` matches,
// for rendering a highlighted suggestion label. Returns the whole text as
// a single non-matching segment if there's no match (or an empty query).
export function highlightMatch(text: string, rawQuery: string): HighlightSegment[] {
  const query = rawQuery.trim();
  if (!query) return [{ text, match: false }];

  let regex: RegExp;
  try {
    regex = new RegExp(buildFuzzyPattern(query), 'i');
  } catch {
    return [{ text, match: false }];
  }

  const match = regex.exec(text);
  if (!match) return [{ text, match: false }];

  const start = match.index;
  const end = start + match[0].length;
  const segments: HighlightSegment[] = [];
  if (start > 0) segments.push({ text: text.slice(0, start), match: false });
  segments.push({ text: text.slice(start, end), match: true });
  if (end < text.length) segments.push({ text: text.slice(end), match: false });
  return segments;
}
