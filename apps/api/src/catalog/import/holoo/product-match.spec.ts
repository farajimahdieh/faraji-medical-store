import {
  matchKey,
  matchProduct,
  similarity,
  MatchCandidate,
} from './product-match';

const teb = (name: string, slug = name): MatchCandidate => ({
  id: slug,
  name,
  slug,
  brandSlug: 'teb-o-sanat',
});

describe('matchKey', () => {
  it('ignores brand, codes, filler words and spacing', () => {
    expect(matchKey('زانو بند طبی نئوپرن (کد 50400) طب و صنعت')).toBe(
      matchKey('زانوبند نئوپرن'),
    );
  });
});

describe('similarity', () => {
  it('is 1 for equal keys and lower for different products', () => {
    expect(similarity('زانوبند', 'زانوبند')).toBe(1);
    expect(similarity('زانوبندنئوپرن', 'آرنجبندنئوپرن')).toBeLessThan(0.8);
  });
});

describe('matchProduct', () => {
  const catalog = [
    teb('زانوبند نئوپرن چهار فنره قابل تنظیم', 'knee-4spring-adj'),
    teb('زانوبند نئوپرن چهار فنره', 'knee-4spring'),
    teb('آرنج بند نئوپرن', 'elbow'),
    teb('گردنبند طبی سخت چانه دار', 'collar-hard-chin'),
  ];

  it('matches the same product despite spacing and brand text', () => {
    const result = matchProduct('زانوبند نئوپرن چهارفنره طب و صنعت', catalog);
    expect(result).toMatchObject({
      kind: 'match',
      candidate: { slug: 'knee-4spring' },
    });
  });

  it('prefers the closer of two similar products', () => {
    const result = matchProduct(
      'زانوبند چهار فنره نئوپرن قابل تنظیم طب و صنعت',
      catalog,
    );
    expect(result.kind).not.toBe('none');
  });

  it('never matches a different brand to a Teb-o-Sanat product', () => {
    expect(matchProduct('آرنج بند نئوپرن پاکسمن', catalog)).toEqual({
      kind: 'none',
    });
  });

  it('returns none for a product the site does not have', () => {
    expect(matchProduct('ماساژور تفنگی بیورر مدل MG99', catalog)).toEqual({
      kind: 'none',
    });
  });

  it('reports a near tie as ambiguous instead of guessing', () => {
    const twins = [teb('شکم بند نئوپرن', 'a'), teb('شکم بند نئوپرنی', 'b')];
    expect(matchProduct('شکم بند نئوپرن طب و صنعت', twins).kind).toBe('match');
    // A related but different product scores high -- report it, don't guess.
    const sibling = [teb('زانوبند نئوپرن چهار فنره قابل تنظیم', 'four-spring')];
    expect(
      matchProduct('زانوبند نئوپرن ساده قابل تنظیم طب و صنعت', sibling).kind,
    ).toBe('ambiguous');
  });
});
