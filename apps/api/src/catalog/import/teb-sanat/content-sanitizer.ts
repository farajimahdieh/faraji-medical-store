// Cleans teb-sanat's WooCommerce description HTML into plain text safe to
// store and render on Faraji's own site: strips scripts/tags, decodes
// entities, and drops the source's own "buy from us" boilerplate/links
// (which point at a competitor's storefront and must never appear here).

const ENTITY_MAP: Record<string, string> = {
  nbsp: ' ',
  amp: '&',
  quot: '"',
  apos: "'",
  '#39': "'",
  lt: '<',
  gt: '>',
  zwnj: '‌',
};

function decodeEntities(text: string): string {
  return text.replace(/&(#?\w+);/g, (match, entity: string) => {
    if (entity in ENTITY_MAP) return ENTITY_MAP[entity];
    if (/^#\d+$/.test(entity)) {
      return String.fromCodePoint(Number(entity.slice(1)));
    }
    return match;
  });
}

const JUNK_LINE_PATTERNS = [
  /sanigol\.com/i,
  /خرید\s*(محصول|اینترنتی)/,
  /توضیحات تکمیلی/,
];

function isJunkLine(line: string): boolean {
  return JUNK_LINE_PATTERNS.some((pattern) => pattern.test(line));
}

export function sanitizeSourceHtml(html: string): string {
  if (!html) return '';

  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    // Drop any link pointing at the competitor storefront entirely,
    // including its inner text (usually a "buy now" call to action).
    .replace(/<a\b[^>]*href="[^"]*sanigol\.com[^"]*"[^>]*>[\s\S]*?<\/a>/gi, '')
    .replace(/<li[^>]*>/gi, '\n- ')
    .replace(/<\/(p|div|h[1-6]|li)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '');

  text = decodeEntities(text);

  const lines = text
    .split('\n')
    .map((line) => line.replace(/\u00A0/g, ' ').trim())
    .filter((line) => line.length > 0 && !isJunkLine(line));

  return lines.join('\n').trim();
}

const USAGE_HEADING = /^موارد\s*(استفاده|کاربرد)/;
const STOP_HEADING = /^(نکات مهم|هشدار|موارد منع مصرف|احتیاط)/;

// Pulls short bullet-style usage lines out of an already-sanitized
// description into individual features. Returns [] if the source has no
// recognizable "موارد استفاده" section — features are never invented.
export function extractFeaturesFromDescription(
  sanitizedDescription: string,
): string[] {
  const lines = sanitizedDescription.split('\n');
  const startIndex = lines.findIndex((line) => USAGE_HEADING.test(line));
  if (startIndex === -1) return [];

  const features: string[] = [];
  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.length === 0) continue;
    if (STOP_HEADING.test(line) || USAGE_HEADING.test(line)) break;
    features.push(line.replace(/^-\s*/, ''));
  }
  return features;
}
