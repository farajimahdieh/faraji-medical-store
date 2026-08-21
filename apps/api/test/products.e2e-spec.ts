import { Test, TestingModule } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';

const ORTHOPEDIC_CATEGORY_SLUG = 'orthopedic-mobility-rehab';
const TEB_O_SANAT_BRAND_SLUG = 'teb-o-sanat';

describe('Products/Categories (e2e)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /categories/:slug', () => {
    it('resolves the orthopedic root category', async () => {
      const res = await request(app.getHttpServer())
        .get(`/categories/${ORTHOPEDIC_CATEGORY_SLUG}`)
        .expect(200);

      expect(res.body.slug).toBe(ORTHOPEDIC_CATEGORY_SLUG);
      expect(res.body.name).toBe('ارتوپدی، حرکتی و توانبخشی');
      expect(res.body.parent).toBeNull();
    });

    it('404s for an unknown category slug', () => {
      return request(app.getHttpServer())
        .get('/categories/does-not-exist')
        .expect(404);
    });
  });

  describe('GET /products?category=', () => {
    it('includes products from every subcategory under the root', async () => {
      const res = await request(app.getHttpServer())
        .get(`/products?category=${ORTHOPEDIC_CATEGORY_SLUG}&limit=1`)
        .expect(200);

      expect(res.body.total).toBeGreaterThan(0);
    });

    it('returns an empty page (not an error) for an unknown category', async () => {
      const res = await request(app.getHttpServer())
        .get('/products?category=does-not-exist')
        .expect(200);

      expect(res.body.total).toBe(0);
      expect(res.body.items).toEqual([]);
    });
  });

  describe('GET /products?q=', () => {
    it('finds products by a plain-Persian search term', async () => {
      const res = await request(app.getHttpServer())
        .get('/products?q=کمربند')
        .expect(200);

      // Search also matches via category/subcategory name (e.g. "کمربند
      // طبی"), so not every hit's own product name need contain the term —
      // just require that at least the literal-name matches are present.
      expect(res.body.total).toBeGreaterThan(0);
      expect(
        res.body.items.some((item: { name: string }) =>
          item.name.includes('کمربند'),
        ),
      ).toBe(true);
    });

    it('normalizes Arabic-script Yeh/Kaf so results match the Persian form', async () => {
      const [persian, arabic] = await Promise.all([
        request(app.getHttpServer()).get('/products?q=کمربند').expect(200),
        // ك (Arabic kaf, U+0643) instead of ک (Persian kaf, U+06A9)
        request(app.getHttpServer()).get('/products?q=كمربند').expect(200),
      ]);

      expect(arabic.body.total).toBe(persian.body.total);
    });

    it('returns an empty, non-error result for a query that matches nothing', async () => {
      const res = await request(app.getHttpServer())
        .get('/products?q=zzz-not-a-real-product-zzz')
        .expect(200);

      expect(res.body.total).toBe(0);
      expect(res.body.items).toEqual([]);
    });

    it('handles an empty query string gracefully (no filter applied)', async () => {
      const res = await request(app.getHttpServer())
        .get('/products?q=')
        .expect(200);

      expect(res.body.total).toBeGreaterThan(0);
    });
  });

  describe('GET /products?brand=&size=', () => {
    it('filters by brand slug', async () => {
      const res = await request(app.getHttpServer())
        .get(`/products?brand=${TEB_O_SANAT_BRAND_SLUG}&limit=1`)
        .expect(200);

      expect(res.body.total).toBeGreaterThan(0);
    });

    it('filters by variant size', async () => {
      const res = await request(app.getHttpServer())
        .get('/products?size=M&limit=1')
        .expect(200);

      expect(res.body.total).toBeGreaterThan(0);
    });

    it('combines category, search, brand and size filters (AND semantics)', async () => {
      const [combined, categoryOnly] = await Promise.all([
        request(app.getHttpServer())
          .get(
            `/products?category=${ORTHOPEDIC_CATEGORY_SLUG}&q=کمربند&brand=${TEB_O_SANAT_BRAND_SLUG}&size=M`,
          )
          .expect(200),
        request(app.getHttpServer())
          .get(`/products?category=${ORTHOPEDIC_CATEGORY_SLUG}`)
          .expect(200),
      ]);

      expect(combined.body.total).toBeLessThanOrEqual(categoryOnly.body.total);
    });
  });

  describe('GET /products — pagination & sorting', () => {
    it('resets cleanly to page 1 and respects limit', async () => {
      const res = await request(app.getHttpServer())
        .get('/products?page=1&limit=5')
        .expect(200);

      expect(res.body.page).toBe(1);
      expect(res.body.items.length).toBeLessThanOrEqual(5);
    });

    it('sorts alphabetically when sort=name', async () => {
      const res = await request(app.getHttpServer())
        .get('/products?sort=name&limit=20')
        .expect(200);

      const names = res.body.items.map((item: { name: string }) => item.name);
      const sorted = [...names].sort((a, b) => a.localeCompare(b, 'fa'));
      expect(names).toEqual(sorted);
    });
  });

  describe('GET /products/facets', () => {
    it('returns only subcategories/brands that have active products', async () => {
      const res = await request(app.getHttpServer())
        .get(`/products/facets?category=${ORTHOPEDIC_CATEGORY_SLUG}`)
        .expect(200);

      expect(res.body.subcategories.length).toBeGreaterThan(0);
      expect(
        res.body.subcategories.every(
          (option: { count: number }) => option.count > 0,
        ),
      ).toBe(true);
      expect(res.body.brands.length).toBeGreaterThan(0);
      expect(
        res.body.brands.some(
          (option: { slug: string }) => option.slug === TEB_O_SANAT_BRAND_SLUG,
        ),
      ).toBe(true);
    });

    it('orders sizes XS→S→M→L→XL→XXL with "تک سایز" last', async () => {
      const res = await request(app.getHttpServer())
        .get(`/products/facets?category=${ORTHOPEDIC_CATEGORY_SLUG}`)
        .expect(200);

      const sizes: string[] = res.body.sizes.map(
        (option: { size: string }) => option.size,
      );
      const standardOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
      const present = standardOrder.filter((size) => sizes.includes(size));
      const presentIndices = present.map((size) => sizes.indexOf(size));
      expect(presentIndices).toEqual([...presentIndices].sort((a, b) => a - b));

      if (sizes.includes('تک سایز')) {
        expect(sizes[sizes.length - 1]).toBe('تک سایز');
      }
    });
  });
});
