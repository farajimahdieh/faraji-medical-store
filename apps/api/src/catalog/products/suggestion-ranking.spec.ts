import {
  compareRanked,
  RANK_BRAND,
  RANK_CONTAINS,
  RANK_EXACT,
  RANK_STARTS_WITH,
  RANK_SUBCATEGORY,
  RANK_WHOLE_WORD,
  Ranked,
  rankForProductName,
  rankForSecondaryField,
} from './suggestion-ranking';

describe('rankForProductName', () => {
  it('ranks an exact match above everything else', () => {
    expect(rankForProductName('گردنبند', 'گردنبند')).toBe(RANK_EXACT);
  });

  it('ranks a name starting with the query as starts-with', () => {
    expect(rankForProductName('گردنبند طبی سخت', 'گرد')).toBe(RANK_STARTS_WITH);
  });

  it('ranks the query as a later whole word above a mid-word contains', () => {
    // "پا" is a standalone word later in the name, not just a substring.
    expect(rankForProductName('دستگاه پا و مچ پا', 'پا')).toBe(RANK_WHOLE_WORD);
  });

  it('ranks a mid-word substring as contains, the lowest precise tier', () => {
    // "س" only appears inside "لباس", never as its own word or a prefix.
    expect(rankForProductName('لباس بیمار', 'س')).toBe(RANK_CONTAINS);
  });

  it('orders starts-with above whole-word above contains', () => {
    expect(RANK_STARTS_WITH).toBeLessThan(RANK_WHOLE_WORD);
    expect(RANK_WHOLE_WORD).toBeLessThan(RANK_CONTAINS);
  });
});

describe('rankForSecondaryField', () => {
  it('promotes an exact field match to the top tier regardless of field type', () => {
    expect(rankForSecondaryField('طب و صنعت', 'طب و صنعت', RANK_BRAND)).toBe(
      RANK_EXACT,
    );
  });

  it('falls back to the given tier for a non-exact match', () => {
    expect(rankForSecondaryField('گردنبند طبی', 'گرد', RANK_SUBCATEGORY)).toBe(
      RANK_SUBCATEGORY,
    );
  });

  it('keeps subcategory ranked above brand', () => {
    expect(RANK_SUBCATEGORY).toBeLessThan(RANK_BRAND);
  });
});

describe('compareRanked', () => {
  it('sorts lower rank first, and by length within the same rank', () => {
    const items: Ranked<string>[] = [
      { rank: 1, length: 10, value: 'long-prefix-match' },
      { rank: 0, length: 5, value: 'exact' },
      { rank: 1, length: 3, value: 'short-prefix-match' },
    ];
    const sorted = [...items].sort(compareRanked).map((item) => item.value);
    expect(sorted).toEqual([
      'exact',
      'short-prefix-match',
      'long-prefix-match',
    ]);
  });
});
