import { Test, TestingModule } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';

describe('Product suggestions (e2e)', () => {
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

  it('suggests گردنبند products for "گرد"', async () => {
    const res = await request(app.getHttpServer())
      .get('/products/suggestions?q=گرد')
      .expect(200);

    expect(res.body.suggestions.length).toBeGreaterThan(0);
    expect(
      res.body.suggestions.every((s: { label: string }) =>
        s.label.includes('گرد'),
      ),
    ).toBe(true);
  });

  it('suggests زانوبند products for "زان"', async () => {
    const res = await request(app.getHttpServer())
      .get('/products/suggestions?q=زان')
      .expect(200);

    expect(res.body.suggestions.length).toBeGreaterThan(0);
    expect(
      res.body.suggestions.some((s: { label: string }) =>
        s.label.includes('زانو'),
      ),
    ).toBe(true);
  });

  it('ranks a name-prefix match above a name-contains match', async () => {
    const res = await request(app.getHttpServer())
      .get('/products/suggestions?q=قوز&limit=8')
      .expect(200);

    const labels: string[] = res.body.suggestions.map(
      (s: { label: string }) => s.label,
    );
    // "قوزبند کشی..." starts with قوز; "کتف بند و قوزبند" only contains it.
    const prefixIndex = labels.indexOf('قوزبند کشی (همراه با کمربند)');
    const containsIndex = labels.indexOf('کتف بند و قوزبند');
    expect(prefixIndex).toBeGreaterThanOrEqual(0);
    expect(containsIndex).toBeGreaterThanOrEqual(0);
    expect(prefixIndex).toBeLessThan(containsIndex);
  });

  it('includes a subcategory suggestion when relevant', async () => {
    const res = await request(app.getHttpServer())
      .get('/products/suggestions?q=قوز&limit=8')
      .expect(200);

    expect(
      res.body.suggestions.some(
        (s: { type: string; slug: string }) =>
          s.type === 'subcategory' && s.slug === 'posture-corrector',
      ),
    ).toBe(true);
  });

  it('finds brand/brand-related results for "طب"', async () => {
    const res = await request(app.getHttpServer())
      .get('/products/suggestions?q=طب')
      .expect(200);

    expect(res.body.suggestions.length).toBeGreaterThan(0);
  });

  it('normalizes Arabic-script Yeh/Kaf', async () => {
    const [persian, arabic] = await Promise.all([
      request(app.getHttpServer())
        .get('/products/suggestions?q=کمربند')
        .expect(200),
      request(app.getHttpServer())
        .get('/products/suggestions?q=كمربند')
        .expect(200),
    ]);
    expect(arabic.body.suggestions).toEqual(persian.body.suggestions);
  });

  it('works from a single Persian character', async () => {
    const res = await request(app.getHttpServer())
      .get('/products/suggestions?q=پ&limit=8')
      .expect(200);

    expect(res.body.suggestions.length).toBeGreaterThan(0);
    expect(
      res.body.suggestions.every((s: { label: string }) =>
        s.label.includes('پ'),
      ),
    ).toBe(true);
  });

  it('finds a single character even mid-word, not just as a prefix', async () => {
    const res = await request(app.getHttpServer())
      .get('/products/suggestions?q=س&limit=8')
      .expect(200);

    expect(res.body.suggestions.length).toBeGreaterThan(0);
    // "سیلندر فشاری دست" starts with س; if it's present it must rank first
    // — but the real assertion is that mid-word matches are found at all.
    const labels: string[] = res.body.suggestions.map(
      (s: { label: string }) => s.label,
    );
    expect(labels.some((label) => !label.startsWith('س'))).toBe(true);
  });

  it('ranks a starts-with match above a same-name whole-word match, above a mid-word contains', async () => {
    const res = await request(app.getHttpServer())
      .get('/products/suggestions?q=پا&limit=8')
      .expect(200);

    const labels: string[] = res.body.suggestions.map(
      (s: { label: string }) => s.label,
    );
    const startsWithIndex = labels.indexOf('پاشنه پوش ضد ترک پا'); // starts with "پا"
    const wholeWordIndex = labels.indexOf('آتل انگشت دست و پا'); // "پا" as its own trailing word
    const containsIndex = labels.indexOf('پد پاشنه سیلیکونی'); // "پا" only inside "پاشنه"

    expect(startsWithIndex).toBeGreaterThanOrEqual(0);
    expect(wholeWordIndex).toBeGreaterThanOrEqual(0);
    expect(containsIndex).toBeGreaterThanOrEqual(0);
    expect(startsWithIndex).toBeLessThan(wholeWordIndex);
    expect(wholeWordIndex).toBeLessThan(containsIndex);
  });

  it('returns an empty list for an empty query', async () => {
    const res = await request(app.getHttpServer())
      .get('/products/suggestions?q=')
      .expect(200);
    expect(res.body.suggestions).toEqual([]);
  });

  it('returns an empty list for a single character that matches nothing real', async () => {
    // Neither "q" nor "z" appears anywhere in this catalog's names, brands,
    // categories, or product codes — verified directly against the DB.
    const res = await request(app.getHttpServer())
      .get('/products/suggestions?q=q')
      .expect(200);
    expect(res.body.suggestions).toEqual([]);
  });

  it('returns an empty, non-error list for a query matching nothing at all', async () => {
    const res = await request(app.getHttpServer())
      .get('/products/suggestions?q=zzznotarealproductzzz')
      .expect(200);
    expect(res.body.suggestions).toEqual([]);
  });

  it('tolerates a small typo via the fuzzy fallback', async () => {
    // "گردنند" — "گردنبند" missing its "ب"
    const res = await request(app.getHttpServer())
      .get('/products/suggestions?q=گردنند')
      .expect(200);

    expect(res.body.suggestions.length).toBeGreaterThan(0);
    expect(
      res.body.suggestions.some((s: { label: string }) =>
        s.label.includes('گردن'),
      ),
    ).toBe(true);
  });

  it('caps results at the requested limit', async () => {
    const res = await request(app.getHttpServer())
      .get('/products/suggestions?q=بند&limit=5')
      .expect(200);
    expect(res.body.suggestions.length).toBeLessThanOrEqual(5);
  });

  it('rejects a limit above the 8-result cap', async () => {
    await request(app.getHttpServer())
      .get('/products/suggestions?q=بند&limit=20')
      .expect(400);
  });

  it('each product suggestion carries only the lightweight fields (no description)', async () => {
    const res = await request(app.getHttpServer())
      .get('/products/suggestions?q=گردنبند')
      .expect(200);

    const product = res.body.suggestions.find(
      (s: { type: string }) => s.type === 'product',
    );
    expect(product).toBeDefined();
    expect(Object.keys(product).sort()).toEqual(
      ['brand', 'id', 'image', 'label', 'slug', 'type'].sort(),
    );
  });
});
