import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';

import { ProductMatcher, normalizeForMatching } from './product-matcher';
import { Product } from '../../entities/product.entity';
import { ProductSource } from '../../entities/product-source.entity';
import { NormalizedProduct } from './product-normalizer';

function buildNormalized(
  overrides: Partial<NormalizedProduct> = {},
): NormalizedProduct {
  return {
    sourceProductId: 278,
    name: 'زانوبند نئوپرن ساده',
    slug: 'زانوبند-نئوپرن-ساده',
    sku: '41200',
    sourceUrl: 'https://teb-sanat.com/product/zanuband-neopren-sadeh',
    shortDescription: null,
    description: null,
    features: [],
    images: [],
    sizes: ['S', 'M', 'L'],
    subcategory: { name: 'زانوبند', slug: 'knee-support' },
    videoUrl: null,
    videoSource: null,
    ...overrides,
  };
}

async function buildTestMatcher() {
  const productRepo = { findBy: jest.fn() };
  const sourceRepo = { findOne: jest.fn(), findBy: jest.fn() };

  const moduleRef = await Test.createTestingModule({
    providers: [
      ProductMatcher,
      { provide: getRepositoryToken(Product), useValue: productRepo },
      { provide: getRepositoryToken(ProductSource), useValue: sourceRepo },
    ],
  }).compile();

  return {
    matcher: moduleRef.get(ProductMatcher),
    productRepo,
    sourceRepo,
  };
}

describe('normalizeForMatching', () => {
  it('is case-insensitive and ignores extra whitespace', () => {
    expect(normalizeForMatching('  Zanuband   ')).toBe(
      normalizeForMatching('zanuband'),
    );
  });
});

describe('ProductMatcher.loadTebSanatSourceCodesByProductId', () => {
  it('maps each product id to its teb-sanat externalProductCode', async () => {
    const { matcher, sourceRepo } = await buildTestMatcher();
    sourceRepo.findBy.mockResolvedValue([
      { productId: 'p1', externalProductCode: '93100' },
      { productId: 'p2', externalProductCode: '93200' },
      { productId: 'p3', externalProductCode: null },
    ]);

    const result = await matcher.loadTebSanatSourceCodesByProductId();

    expect(result.get('p1')).toBe('93100');
    expect(result.get('p2')).toBe('93200');
    expect(result.has('p3')).toBe(false);
  });
});

describe('ProductMatcher.findExisting (duplicate detection)', () => {
  it('matches on sourceName + externalProductCode first, even if the URL changed', async () => {
    const { matcher, sourceRepo } = await buildTestMatcher();
    const matchedProduct = { id: 'product-1' } as Product;
    sourceRepo.findOne.mockResolvedValueOnce({ product: matchedProduct });

    const result = await matcher.findExisting(
      buildNormalized({ sourceUrl: 'https://teb-sanat.com/product/new-url' }),
      new Map(),
      new Map(),
    );

    expect(result).toBe(matchedProduct);
    expect(sourceRepo.findOne).toHaveBeenCalledTimes(1);
    expect(sourceRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { sourceName: 'teb-sanat', externalProductCode: '41200' },
      }),
    );
  });

  it('falls back to sourceUrl when no source-code match exists', async () => {
    const { matcher, sourceRepo } = await buildTestMatcher();
    const matchedProduct = { id: 'product-2' } as Product;
    sourceRepo.findOne
      .mockResolvedValueOnce(null) // source-code lookup misses
      .mockResolvedValueOnce({ product: matchedProduct }); // url lookup hits

    const result = await matcher.findExisting(
      buildNormalized(),
      new Map(),
      new Map(),
    );

    expect(result).toBe(matchedProduct);
    expect(sourceRepo.findOne).toHaveBeenCalledTimes(2);
  });

  it('falls back to brand + normalized name when neither source match exists', async () => {
    const { matcher, sourceRepo } = await buildTestMatcher();
    sourceRepo.findOne.mockResolvedValue(null);
    const matchedProduct = {
      id: 'product-3',
      name: 'زانوبند نئوپرن ساده',
    } as Product;
    const existingByName = new Map([
      [normalizeForMatching('زانوبند نئوپرن ساده'), matchedProduct],
    ]);

    const result = await matcher.findExisting(
      buildNormalized(),
      existingByName,
      new Map(),
    );

    expect(result).toBe(matchedProduct);
  });

  it('returns null (a genuinely new product) when nothing matches', async () => {
    const { matcher, sourceRepo } = await buildTestMatcher();
    sourceRepo.findOne.mockResolvedValue(null);

    const result = await matcher.findExisting(
      buildNormalized(),
      new Map(),
      new Map(),
    );

    expect(result).toBeNull();
  });

  it('does NOT merge two different source SKUs that happen to share a display name', async () => {
    // Real case hit in production: "محافظ گچ و پانسمان در حمام" exists on
    // teb-sanat as two distinct products (SKUs 93100 and 93200). The
    // second one must not be folded into the first just because the name
    // matches — it's a different product, not a re-import.
    const { matcher, sourceRepo } = await buildTestMatcher();
    sourceRepo.findOne.mockResolvedValue(null); // no code/url match

    const firstProduct = {
      id: 'product-93100',
      name: 'محافظ گچ و پانسمان در حمام',
    } as Product;
    const existingByName = new Map([
      [normalizeForMatching('محافظ گچ و پانسمان در حمام'), firstProduct],
    ]);
    const tebSanatSourceCodesByProductId = new Map([
      ['product-93100', '93100'],
    ]);

    const result = await matcher.findExisting(
      buildNormalized({
        name: 'محافظ گچ و پانسمان در حمام',
        sku: '93200',
      }),
      existingByName,
      tebSanatSourceCodesByProductId,
    );

    expect(result).toBeNull();
  });

  it('still matches by name when the existing product has no teb-sanat source yet', async () => {
    // e.g. a product created by hand/seed, now being linked to its real source.
    const { matcher, sourceRepo } = await buildTestMatcher();
    sourceRepo.findOne.mockResolvedValue(null);

    const matchedProduct = {
      id: 'product-seed',
      name: 'کمربند کار',
    } as Product;
    const existingByName = new Map([
      [normalizeForMatching('کمربند کار'), matchedProduct],
    ]);

    const result = await matcher.findExisting(
      buildNormalized({ name: 'کمربند کار', sku: '99999' }),
      existingByName,
      new Map(), // no teb-sanat source recorded for this product yet
    );

    expect(result).toBe(matchedProduct);
  });
});
