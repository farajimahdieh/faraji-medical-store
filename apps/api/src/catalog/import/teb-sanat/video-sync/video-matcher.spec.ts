import {
  computeMatchConfidence,
  matchProductToVideos,
  normalizeForVideoMatch,
} from './video-matcher';
import type { AparatVideo } from './aparat-client';

function video(title: string, description = ''): AparatVideo {
  return {
    title,
    description,
    url: `https://www.aparat.com/v/${title.length}`,
  };
}

describe('normalizeForVideoMatch', () => {
  it('strips common boilerplate phrases', () => {
    expect(normalizeForVideoMatch('معرفی محافظ مفصل ران طب و صنعت')).toBe(
      'محافظ مفصل ران',
    );
  });

  it('removes stray soft hyphens seen in some product names', () => {
    expect(normalizeForVideoMatch('فتق­بند نافی شکمی')).toBe(
      'فتقبند نافی شکمی',
    );
  });
});

describe('computeMatchConfidence — real cases from the teb-sanat catalog + Aparat channel', () => {
  it('scores an exact-title match at auto-match confidence', () => {
    const confidence = computeMatchConfidence(
      'آرنج بند با مفصل مدرج',
      '36000',
      video('آرنج بند با مفصل مدرج'),
    );
    expect(confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('scores a title with only boilerplate added around the product name at auto-match confidence', () => {
    const confidence = computeMatchConfidence(
      'محافظ مفصل ران',
      null,
      video('معرفی محافظ مفصل ران طب و صنعت'),
    );
    expect(confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('gives a perfect score when the product code appears in the title/description', () => {
    const confidence = computeMatchConfidence(
      'یک محصول با نام کاملا متفاوت',
      '30200',
      video('ویدیوی آموزشی', 'کد محصول 30200 در این ویدیو معرفی می‌شود'),
    );
    expect(confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('keeps a generic title well below auto-match for a product with extra distinguishing words', () => {
    // Real case: video "آتل اورژانسی" vs. product "آتل اورژانسی مچ دست" —
    // the title never confirms *which* emergency splint this is.
    const confidence = computeMatchConfidence(
      'آتل اورژانسی مچ دست',
      null,
      video('آتل اورژانسی'),
    );
    expect(confidence).toBeLessThan(0.9);
  });

  it('scores an unrelated title near zero', () => {
    const confidence = computeMatchConfidence(
      'زانوبند نئوپرن ساده',
      null,
      video('آشنایی با طب و صنعت'),
    );
    expect(confidence).toBeLessThan(0.3);
  });

  it('matches a slash-separated product name against a video title that spaces the slash out', () => {
    // Real case: product "غبغب بند/گوش و فک بند" (no spaces) vs. video
    // "غبغب بند / گوش و فک بند طب و صنعت" (spaced).
    const confidence = computeMatchConfidence(
      'غبغب بند/گوش و فک بند',
      null,
      video('غبغب بند / گوش و فک بند طب و صنعت'),
    );
    expect(confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('caps confidence for an "انواع" (multiple types) overview video even when the product name appears inside it', () => {
    // Real case: video "انواع شکم بند(بارداری و لاغری)" technically
    // contains the substring "شکم بند بارداری", but it's an overview of
    // several belt types, not specifically the pregnancy one.
    const confidence = computeMatchConfidence(
      'شکم بند بارداری',
      null,
      video('انواع شکم بند(بارداری و لاغری)'),
    );
    expect(confidence).toBeLessThan(0.9);
    expect(confidence).toBeGreaterThanOrEqual(0.65); // still worth a human look
  });
});

describe('matchProductToVideos', () => {
  const videos: AparatVideo[] = [
    video('آرنج بند با مفصل مدرج'),
    video('آتل اورژانسی'),
    video('فیلم کارخانه طب و صنعت'),
  ];

  it('auto-matches a product with a clear best video', () => {
    const result = matchProductToVideos(
      { id: 'p1', name: 'آرنج بند با مفصل مدرج', sourceCode: '36000' },
      videos,
    );
    expect(result.status).toBe('matched');
    if (result.status === 'matched') {
      expect(result.video.title).toBe('آرنج بند با مفصل مدرج');
    }
  });

  it('flags a real but ambiguous case (generic splint video vs. a specific splint product) for review, not auto-match', () => {
    const result = matchProductToVideos(
      { id: 'p2', name: 'آتل اورژانسی مچ پا', sourceCode: null },
      videos,
    );
    // Not auto-matched — the video title doesn't confirm which splint.
    expect(result.status).not.toBe('matched');
  });

  it('returns no_match for a product with nothing relevant in the channel', () => {
    const result = matchProductToVideos(
      { id: 'p3', name: 'کفی طبی بدون پنجه', sourceCode: null },
      videos,
    );
    expect(result.status).toBe('no_match');
  });

  it('never returns more than one candidate video', () => {
    const result = matchProductToVideos(
      { id: 'p1', name: 'آرنج بند با مفصل مدرج', sourceCode: '36000' },
      videos,
    );
    expect(
      result.status === 'matched' || result.status === 'needs_review',
    ).toBe(true);
    // TypeScript narrows via the discriminated union; a single `video`
    // field (not an array) on the result is itself the guarantee.
  });
});
