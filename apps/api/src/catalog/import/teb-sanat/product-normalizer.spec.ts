import {
  normalizeProductName,
  parseSizeTerms,
  normalizeSourceProduct,
} from './product-normalizer';
import { TebSanatProduct } from './teb-sanat.types';

function buildRawProduct(
  overrides: Partial<TebSanatProduct> = {},
): TebSanatProduct {
  return {
    id: 278,
    name: '  زانوبند   نئوپرن ساده ',
    slug: '%d8%b2%d8%a7%d9%86%d9%88%d8%a8%d9%86%d8%af-%d9%86%d8%a6%d9%88%d9%be%d8%b1%d9%86-%d8%b3%d8%a7%d8%af%d9%87',
    type: 'simple',
    permalink:
      'https://teb-sanat.com/product/%d8%b2%d8%a7%d9%86%d9%88%d8%a8%d9%86%d8%af-%d9%86%d8%a6%d9%88%d9%be%d8%b1%d9%86-%d8%b3%d8%a7%d8%af%d9%87/',
    sku: '41200',
    short_description: '<p>خلاصه</p>',
    description:
      '<p>توضیح کلی محصول.</p><span><strong>موارد استفاده:</strong></span><br />حمایت از زانو<br />کاهش درد',
    images: [
      {
        id: 1,
        src: 'https://teb-sanat.com/wp-content/uploads/a.jpg',
        name: 'a',
        alt: '',
      },
      {
        id: 2,
        src: 'https://teb-sanat.com/wp-content/uploads/b.jpg',
        name: 'b',
        alt: '',
      },
    ],
    categories: [{ id: 32, name: 'زانوبند', slug: 'zanuband' }],
    attributes: [
      {
        id: 1,
        name: 'سایز بندی:',
        taxonomy: 'pa_سایز-بندی',
        terms: [
          { id: 19, name: 'S', slug: 's' },
          { id: 20, name: 'M', slug: 'm' },
          { id: 21, name: 'L', slug: 'l' },
          { id: 22, name: 'XL', slug: 'xl' },
          { id: 23, name: 'XXL', slug: 'xxl' },
        ],
      },
    ],
    ...overrides,
  };
}

describe('normalizeProductName', () => {
  it('collapses repeated internal whitespace and trims the ends', () => {
    expect(normalizeProductName('  زانوبند   نئوپرن ساده ')).toBe(
      'زانوبند نئوپرن ساده',
    );
  });

  it('unifies Arabic-script Yeh/Kaf into their Persian forms', () => {
    // ي (Arabic Yeh, U+064A) and ك (Arabic Kaf, U+0643)
    expect(normalizeProductName('كيسه يخ')).toBe('کیسه یخ');
  });
});

describe('parseSizeTerms (size parser)', () => {
  it('reads every size term off the sizing attribute, in order', () => {
    const product = buildRawProduct();
    expect(parseSizeTerms(product)).toEqual(['S', 'M', 'L', 'XL', 'XXL']);
  });

  it("returns the source's own single-size label unchanged", () => {
    const product = buildRawProduct({
      attributes: [
        {
          id: 1,
          name: 'سایز بندی:',
          taxonomy: 'pa_سایز-بندی',
          terms: [{ id: 38, name: 'تک سایز', slug: 'free-size' }],
        },
      ],
    });
    expect(parseSizeTerms(product)).toEqual(['تک سایز']);
  });

  it('returns an empty array rather than inventing a size when the attribute is missing', () => {
    const product = buildRawProduct({ attributes: [] });
    expect(parseSizeTerms(product)).toEqual([]);
  });
});

describe('normalizeSourceProduct (product parser + grouping)', () => {
  it('groups every size term of one source product into a single normalized product', () => {
    const normalized = normalizeSourceProduct(buildRawProduct(), [32]);

    // One product, not five — sizes live on `sizes`, there is no splitting
    // into several products for a multi-size source item.
    expect(normalized.sizes).toEqual(['S', 'M', 'L', 'XL', 'XXL']);
    expect(normalized.name).toBe('زانوبند نئوپرن ساده');
  });

  it('decodes the percent-encoded source slug into readable Persian text', () => {
    const normalized = normalizeSourceProduct(buildRawProduct(), [32]);
    expect(normalized.slug).toBe('زانوبند-نئوپرن-ساده');
  });

  it('normalizes the permalink into the sourceUrl used for dedupe matching', () => {
    const normalized = normalizeSourceProduct(buildRawProduct(), [32]);
    expect(normalized.sourceUrl).toBe(
      'https://teb-sanat.com/product/%d8%b2%d8%a7%d9%86%d9%88%d8%a8%d9%86%d8%af-%d9%86%d8%a6%d9%88%d9%be%d8%b1%d9%86-%d8%b3%d8%a7%d8%af%d9%87',
    );
  });

  it('extracts features from the sanitized description', () => {
    const normalized = normalizeSourceProduct(buildRawProduct(), [32]);
    expect(normalized.features).toEqual(['حمایت از زانو', 'کاهش درد']);
  });

  it('classifies the product into a Faraji subcategory from its source categories', () => {
    const normalized = normalizeSourceProduct(buildRawProduct(), [32]);
    expect(normalized.subcategory).toEqual({
      name: 'زانوبند',
      slug: 'knee-support',
    });
  });

  it('carries every source image through with a stable sort order', () => {
    const normalized = normalizeSourceProduct(buildRawProduct(), [32]);
    expect(normalized.images).toEqual([
      {
        sourceUrl: 'https://teb-sanat.com/wp-content/uploads/a.jpg',
        sortOrder: 0,
      },
      {
        sourceUrl: 'https://teb-sanat.com/wp-content/uploads/b.jpg',
        sortOrder: 1,
      },
    ]);
  });

  it('trusts the crawled category id over an empty/unreliable declared `categories` field', () => {
    // Observed on the real site: some products come back from
    // GET /products?category=32 with their own `categories` field empty.
    const product = buildRawProduct({ categories: [] });
    const normalized = normalizeSourceProduct(product, [32]);
    expect(normalized.subcategory).toEqual({
      name: 'زانوبند',
      slug: 'knee-support',
    });
  });

  it('prefers a specific declared category over a fallback-only crawled tag', () => {
    // "جدیدترین محصولات" (id 37) always classifies to the fallback bucket;
    // a real, specific declared category should win over it.
    const product = buildRawProduct({
      categories: [{ id: 32, name: 'زانوبند', slug: 'zanuband' }],
    });
    const normalized = normalizeSourceProduct(product, [37]);
    expect(normalized.subcategory).toEqual({
      name: 'زانوبند',
      slug: 'knee-support',
    });
  });

  it('extracts a video URL from the raw description without leaking it into the sanitized text', () => {
    const product = buildRawProduct({
      description:
        '<p>توضیح کلی محصول.</p><iframe src="https://www.aparat.com/video/v/abc123"></iframe><p>ادامه توضیح.</p>',
    });
    const normalized = normalizeSourceProduct(product, [32]);

    expect(normalized.videoUrl).toBe('https://www.aparat.com/video/v/abc123');
    expect(normalized.videoSource).toBe('aparat');
    // Sanitizing strips the iframe tag itself, but doesn't invent or leave
    // behind any stray video markup in the visible description text.
    expect(normalized.description).not.toContain('iframe');
    expect(normalized.description).not.toContain('aparat.com');
  });

  it('sets videoUrl/videoSource to null when the source has no video', () => {
    const normalized = normalizeSourceProduct(buildRawProduct(), [32]);
    expect(normalized.videoUrl).toBeNull();
    expect(normalized.videoSource).toBeNull();
  });

  it("does not mistake the source site's generic channel link for a product video", () => {
    const product = buildRawProduct({
      short_description:
        '<p>خلاصه</p><a href="https://www.aparat.com/tebosanat">فیلم های آموزشی</a>',
    });
    const normalized = normalizeSourceProduct(product, [32]);
    expect(normalized.videoUrl).toBeNull();
  });
});
