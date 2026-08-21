import {
  classifyProduct,
  FALLBACK_SUBCATEGORY,
  resolveProductInclusion,
  EXCLUDE_PRODUCT_IDS,
  NEEDS_REVIEW_PRODUCT_IDS,
} from './category-map';

describe('classifyProduct', () => {
  it('maps a direct 1:1 category (knee support) regardless of product name', () => {
    expect(classifyProduct([32], 'زانوبند نئوپرن ساده')).toEqual({
      name: 'زانوبند',
      slug: 'knee-support',
    });
  });

  it('splits the "ستون فقزات پشتی کمری" bucket into posture-corrector by keyword', () => {
    expect(classifyProduct([30], 'قوزبند طبی مدل الف')).toEqual({
      name: 'قوزبند',
      slug: 'posture-corrector',
    });
  });

  it('falls back to lumbar support for the same bucket without the keyword', () => {
    expect(classifyProduct([30], 'کمربند طبی کمر مدل ب')).toEqual({
      name: 'کمربند طبی',
      slug: 'lumbar-support',
    });
  });

  it('splits the upper-limb bucket by keyword: arm sling', () => {
    expect(classifyProduct([15], 'آویز دست مدل ساده')).toEqual({
      name: 'آویز دست',
      slug: 'arm-sling',
    });
  });

  it('splits the upper-limb bucket by keyword: elbow', () => {
    expect(classifyProduct([15], 'آرنج‌بند نئوپرن')).toEqual({
      name: 'آرنج‌بند',
      slug: 'elbow-support',
    });
  });

  it('splits the upper-limb bucket by keyword: wrist', () => {
    expect(classifyProduct([15], 'مچ‌بند کشی')).toEqual({
      name: 'مچ‌بند',
      slug: 'wrist-support',
    });
  });

  it('falls back for an upper-limb product matching no known keyword', () => {
    expect(classifyProduct([15], 'محصول ناشناخته اندام فوقانی')).toEqual(
      FALLBACK_SUBCATEGORY,
    );
  });

  it('splits the foot/ankle bucket by keyword: ankle', () => {
    expect(classifyProduct([16], 'مچ پا بند طبی')).toEqual({
      name: 'مچ پا',
      slug: 'ankle-support',
    });
  });

  it('defaults the foot/ankle bucket to general foot products', () => {
    expect(classifyProduct([16], 'جوراب فشاری پا')).toEqual({
      name: 'محصولات پا',
      slug: 'foot-products',
    });
  });

  it('falls back for a category id that is not in the import allowlist', () => {
    expect(classifyProduct([999], 'محصول عجیب')).toEqual(FALLBACK_SUBCATEGORY);
  });

  it('uses the first matching category when a product has several', () => {
    expect(classifyProduct([999, 32], 'هر اسمی')).toEqual({
      name: 'زانوبند',
      slug: 'knee-support',
    });
  });
});

describe('resolveProductInclusion ("سایر محصولات" manual review)', () => {
  it('excludes every id in EXCLUDE_PRODUCT_IDS', () => {
    for (const id of EXCLUDE_PRODUCT_IDS.keys()) {
      expect(resolveProductInclusion(id)).toBe('exclude');
    }
  });

  it('flags every id in NEEDS_REVIEW_PRODUCT_IDS for review', () => {
    for (const id of NEEDS_REVIEW_PRODUCT_IDS.keys()) {
      expect(resolveProductInclusion(id)).toBe('needs_review');
    }
  });

  it('includes a product id that was reviewed and found relevant', () => {
    // محافظ مفصل ران — a hip joint protector, clearly orthopedic.
    expect(resolveProductInclusion(1290)).toBe('include');
  });

  it('includes any id that was never specifically reviewed (default)', () => {
    expect(resolveProductInclusion(999999)).toBe('include');
  });

  it('exclude and needs-review lists do not overlap', () => {
    for (const id of EXCLUDE_PRODUCT_IDS.keys()) {
      expect(NEEDS_REVIEW_PRODUCT_IDS.has(id)).toBe(false);
    }
  });
});
