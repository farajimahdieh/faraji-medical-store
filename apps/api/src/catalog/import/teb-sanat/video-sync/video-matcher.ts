import type { AparatVideo } from './aparat-client';

// Boilerplate that shows up in Aparat video titles (or occasionally product
// names) and carries no distinguishing signal for matching — stripped
// before comparing.
const BOILERPLATE_PHRASES = [
  'طب و صنعت',
  'محصول',
  'آموزشی',
  'آموزش',
  'نحوه استفاده',
  'نحوه بستن',
  'معرفی و',
  'معرفی',
];

// A real product name uses this with no surrounding spaces
// ("غبغب بند/گوش و فک بند") while the channel's video title for the same
// product uses spaced slashes ("غبغب بند / گوش و فک بند") — stripping the
// slash entirely (rather than treating it as a word character) is what
// makes the two converge to the same token stream.
export function normalizeForVideoMatch(text: string): string {
  let normalized = text
    .replace(/­/g, '') // stray soft hyphens seen in some product names
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک');
  for (const phrase of BOILERPLATE_PHRASES) {
    normalized = normalized.split(phrase).join(' ');
  }
  return normalized
    .replace(/[()،.,:؛/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function wordsOf(text: string): string[] {
  return text.split(' ').filter(Boolean);
}

// "انواع X" ("various kinds of X") is a real, distinctive marker for an
// overview video covering several different items — not one specific
// product, even when that product's name happens to appear inside it
// (e.g. "انواع شکم بند(بارداری و لاغری)" mentions "شکم بند بارداری" but
// is really about several belt types, pregnancy and slimming both).
const MULTI_ITEM_INDICATOR_WORDS = new Set(['انواع']);
const MULTI_ITEM_CONFIDENCE_CAP = 0.85;

function isMultiItemOverview(normalizedTitle: string): boolean {
  return wordsOf(normalizedTitle).some((word) =>
    MULTI_ITEM_INDICATOR_WORDS.has(word),
  );
}

export const AUTO_MATCH_THRESHOLD = 0.9;
export const NEEDS_REVIEW_THRESHOLD = 0.65;

// Scores how likely `video` is to be the instructional video for a product
// with this name/code. Deliberately simple and explainable (no ML/fuzzy
// libraries) — three signals, checked in order of reliability:
//
//   1. the product's own accounting/source code appears verbatim in the
//      video title or description — strongest possible signal.
//   2. the full normalized product name appears as a contiguous phrase in
//      the video title — e.g. "آرنج بند با مفصل مدرج" video for the
//      product of the same name.
//   3. word coverage: what fraction of the product name's words show up
//      in the title (weighted higher) and description (weighted lower).
//      This is what correctly de-prioritizes generic titles like "آتل
//      اورژانسی" against a more specific product like "آتل اورژانسی مچ
//      دست" — the product has extra distinguishing words the title never
//      confirms, so coverage stays well under the auto-match bar.
export function computeMatchConfidence(
  productName: string,
  productCode: string | null,
  video: AparatVideo,
): number {
  const normProduct = normalizeForVideoMatch(productName);
  if (normProduct.length === 0) return 0;

  if (productCode && productCode.trim().length >= 4) {
    const haystack = `${video.title} ${video.description}`;
    if (haystack.includes(productCode.trim())) return 0.98;
  }

  const normTitle = normalizeForVideoMatch(video.title);
  const multiItemCap = isMultiItemOverview(normTitle)
    ? MULTI_ITEM_CONFIDENCE_CAP
    : 1;

  if (normTitle.includes(normProduct)) {
    return Math.min(0.97, multiItemCap);
  }

  const productWords = wordsOf(normProduct);
  const titleWords = new Set(wordsOf(normTitle));
  const descriptionWords = new Set(
    wordsOf(normalizeForVideoMatch(video.description)),
  );

  const inTitle = productWords.filter((word) => titleWords.has(word)).length;
  const inDescriptionOnly = productWords.filter(
    (word) => !titleWords.has(word) && descriptionWords.has(word),
  ).length;

  const titleCoverage = inTitle / productWords.length;
  if (titleCoverage === 1 && productWords.length >= 2) {
    return Math.min(0.93, multiItemCap);
  }

  const descriptionCoverage = inDescriptionOnly / productWords.length;
  return Math.min(0.89, titleCoverage * 0.8 + descriptionCoverage * 0.3);
}

export interface ProductForVideoMatching {
  id: string;
  name: string;
  sourceCode: string | null;
}

export type VideoMatchResult =
  | {
      status: 'matched';
      video: AparatVideo;
      confidence: number;
    }
  | {
      status: 'needs_review';
      video: AparatVideo;
      confidence: number;
    }
  | { status: 'no_match' };

// Picks the single best-scoring video for a product (if any) and buckets
// it by confidence. Never returns more than one candidate — "best video
// wins", so a generic title that weakly matches several products loses to
// an exact/near-exact match on the right one, and otherwise just stays
// below the review threshold for all of them (see computeMatchConfidence).
export function matchProductToVideos(
  product: ProductForVideoMatching,
  videos: AparatVideo[],
): VideoMatchResult {
  let best: { video: AparatVideo; confidence: number } | null = null;

  for (const video of videos) {
    const confidence = computeMatchConfidence(
      product.name,
      product.sourceCode,
      video,
    );
    if (!best || confidence > best.confidence) {
      best = { video, confidence };
    }
  }

  if (!best || best.confidence < NEEDS_REVIEW_THRESHOLD) {
    return { status: 'no_match' };
  }
  if (best.confidence >= AUTO_MATCH_THRESHOLD) {
    return {
      status: 'matched',
      video: best.video,
      confidence: best.confidence,
    };
  }
  return {
    status: 'needs_review',
    video: best.video,
    confidence: best.confidence,
  };
}
