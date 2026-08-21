import { Test, TestingModule } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';

import { ThrottlerGuard } from '@nestjs/throttler';

import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { User } from '../src/users/entities/user.entity';
import { OtpCode } from '../src/auth/entities/otp-code.entity';
import { Session } from '../src/auth/entities/session.entity';
import { SMS_PROVIDER } from '../src/auth/sms/sms-provider.interface';
import { Product, ProductStatus } from '../src/catalog/entities/product.entity';
import { ProductVariant } from '../src/catalog/entities/product-variant.entity';
import { WishlistItem } from '../src/wishlist/entities/wishlist-item.entity';

const TEST_PHONE_A = '09300000010';
const NORMALIZED_PHONE_A = '+989300000010';
const TEST_PHONE_B = '09300000011';
const NORMALIZED_PHONE_B = '+989300000011';

describe('Wishlist (e2e)', () => {
  let app: NestExpressApplication;
  let userRepository: Repository<User>;
  let otpRepository: Repository<OtpCode>;
  let sessionRepository: Repository<Session>;
  let productRepository: Repository<Product>;
  let wishlistRepository: Repository<WishlistItem>;
  let sentCodes: Map<string, string>;

  let productA: Product;
  let productB: Product;
  let variantOfProductA: ProductVariant;
  let variantOfProductB: ProductVariant;

  beforeAll(async () => {
    sentCodes = new Map();
    const testSmsProvider = {
      sendOtp: async (phone: string, code: string) => {
        sentCodes.set(phone, code);
      },
      sendWelcome: async () => undefined,
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SMS_PROVIDER)
      .useValue(testSmsProvider)
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();

    userRepository = moduleFixture.get(getRepositoryToken(User));
    otpRepository = moduleFixture.get(getRepositoryToken(OtpCode));
    sessionRepository = moduleFixture.get(getRepositoryToken(Session));
    productRepository = moduleFixture.get(getRepositoryToken(Product));
    wishlistRepository = moduleFixture.get(getRepositoryToken(WishlistItem));

    const candidates = await productRepository.find({
      where: { status: ProductStatus.ACTIVE },
      relations: { variants: true },
      take: 20,
    });
    const withVariants = candidates.filter(
      (product) => product.variants.length > 0,
    );
    if (withVariants.length < 2) {
      throw new Error(
        'Wishlist e2e tests require at least two active seeded products with variants — run the catalog seed first.',
      );
    }
    [productA, productB] = withVariants;
    variantOfProductA = productA.variants[0];
    variantOfProductB = productB.variants[0];
  });

  afterAll(async () => {
    await cleanupPhone(NORMALIZED_PHONE_A);
    await cleanupPhone(NORMALIZED_PHONE_B);
    await app.close();
  });

  beforeEach(async () => {
    await cleanupPhone(NORMALIZED_PHONE_A);
    await cleanupPhone(NORMALIZED_PHONE_B);
    sentCodes.clear();
  });

  async function cleanupPhone(normalizedPhone: string): Promise<void> {
    await otpRepository.delete({ phone: normalizedPhone });
    const user = await userRepository.findOneBy({ phone: normalizedPhone });
    if (user) {
      await wishlistRepository.delete({ userId: user.id });
      await sessionRepository.delete({ userId: user.id });
      await userRepository.delete({ id: user.id });
    }
  }

  async function signIn(
    phone: string,
    normalizedPhone: string,
  ): Promise<ReturnType<typeof request.agent>> {
    const agent = request.agent(app.getHttpServer());
    await agent.post('/auth/otp/request').send({ phone }).expect(200);
    const code = sentCodes.get(normalizedPhone);
    await agent.post('/auth/otp/verify').send({ phone, code }).expect(200);
    return agent;
  }

  describe('authentication', () => {
    it('rejects every wishlist endpoint without a session', async () => {
      const server = app.getHttpServer();
      await request(server).get('/wishlist').expect(401);
      await request(server).get('/wishlist/count').expect(401);
      await request(server)
        .get(`/wishlist/check?productId=${productA.id}`)
        .expect(401);
      await request(server)
        .post('/wishlist')
        .send({ productId: productA.id })
        .expect(401);
      await request(server)
        .patch('/wishlist/00000000-0000-0000-0000-000000000000')
        .send({ note: 'x' })
        .expect(401);
      await request(server)
        .delete('/wishlist/00000000-0000-0000-0000-000000000000')
        .expect(401);
    });
  });

  describe('POST /wishlist', () => {
    it('adds a product-level item (no variant)', async () => {
      const agent = await signIn(TEST_PHONE_A, NORMALIZED_PHONE_A);

      const res = await agent
        .post('/wishlist')
        .send({ productId: productA.id })
        .expect(201);

      expect(res.body.productId).toBe(productA.id);
      expect(res.body.variantId).toBeNull();
      expect(res.body.wishlistItemId).toEqual(expect.any(String));
    });

    it('adds a variant-level item and validates the variant belongs to the product', async () => {
      const agent = await signIn(TEST_PHONE_A, NORMALIZED_PHONE_A);

      const ok = await agent
        .post('/wishlist')
        .send({ productId: productA.id, variantId: variantOfProductA.id })
        .expect(201);
      expect(ok.body.variantId).toBe(variantOfProductA.id);
      expect(ok.body.size).toBe(variantOfProductA.size);

      const mismatch = await agent
        .post('/wishlist')
        .send({ productId: productA.id, variantId: variantOfProductB.id })
        .expect(400);
      expect(mismatch.body.message).toBeDefined();
    });

    it('404s for a product that does not exist', async () => {
      const agent = await signIn(TEST_PHONE_A, NORMALIZED_PHONE_A);

      await agent
        .post('/wishlist')
        .send({ productId: '00000000-0000-0000-0000-000000000000' })
        .expect(404);
    });

    it('does not create a duplicate on repeated add (idempotent)', async () => {
      const agent = await signIn(TEST_PHONE_A, NORMALIZED_PHONE_A);

      const first = await agent
        .post('/wishlist')
        .send({ productId: productA.id })
        .expect(201);
      const second = await agent
        .post('/wishlist')
        .send({ productId: productA.id })
        .expect(201);

      expect(second.body.wishlistItemId).toBe(first.body.wishlistItemId);

      const countRes = await agent.get('/wishlist/count').expect(200);
      expect(countRes.body.count).toBe(1);
    });

    it('lets two different users wishlist the same product independently', async () => {
      const agentA = await signIn(TEST_PHONE_A, NORMALIZED_PHONE_A);
      const agentB = await signIn(TEST_PHONE_B, NORMALIZED_PHONE_B);

      await agentA
        .post('/wishlist')
        .send({ productId: productA.id })
        .expect(201);
      await agentB
        .post('/wishlist')
        .send({ productId: productA.id })
        .expect(201);

      expect((await agentA.get('/wishlist/count').expect(200)).body.count).toBe(
        1,
      );
      expect((await agentB.get('/wishlist/count').expect(200)).body.count).toBe(
        1,
      );
    });

    it('survives concurrent double-submit without creating a duplicate', async () => {
      const agent = await signIn(TEST_PHONE_A, NORMALIZED_PHONE_A);

      const [first, second] = await Promise.all([
        agent.post('/wishlist').send({ productId: productA.id }),
        agent.post('/wishlist').send({ productId: productA.id }),
      ]);

      expect([first.status, second.status]).toEqual([201, 201]);
      expect(first.body.wishlistItemId).toBe(second.body.wishlistItemId);

      const countRes = await agent.get('/wishlist/count').expect(200);
      expect(countRes.body.count).toBe(1);
    });
  });

  describe('GET /wishlist and /wishlist/count', () => {
    it('returns the current user items with product info, and an accurate count', async () => {
      const agent = await signIn(TEST_PHONE_A, NORMALIZED_PHONE_A);
      await agent
        .post('/wishlist')
        .send({ productId: productA.id })
        .expect(201);
      await agent
        .post('/wishlist')
        .send({ productId: productB.id, variantId: variantOfProductB.id })
        .expect(201);

      const listRes = await agent.get('/wishlist').expect(200);
      expect(listRes.body.total).toBe(2);
      expect(listRes.body.items).toHaveLength(2);
      const productIds = listRes.body.items.map(
        (item: { productId: string }) => item.productId,
      );
      expect(productIds.sort()).toEqual([productA.id, productB.id].sort());
      expect(listRes.body.items[0]).toHaveProperty('productName');
      expect(listRes.body.items[0]).toHaveProperty('productSlug');

      const countRes = await agent.get('/wishlist/count').expect(200);
      expect(countRes.body.count).toBe(2);
    });

    it('includes a price/stock summary derived from the relevant variant(s)', async () => {
      const agent = await signIn(TEST_PHONE_A, NORMALIZED_PHONE_A);

      // No variant chosen -> summarized across all of productA's variants.
      const productLevel = await agent
        .post('/wishlist')
        .send({ productId: productA.id })
        .expect(201);
      expect(productLevel.body.price).toEqual(
        expect.objectContaining({ status: expect.any(String) }),
      );
      expect(['in_stock', 'out_of_stock', 'unknown']).toContain(
        productLevel.body.stockStatus,
      );

      // A specific variant chosen -> summarized from that variant alone.
      const variantLevel = await agent
        .post('/wishlist')
        .send({ productId: productB.id, variantId: variantOfProductB.id })
        .expect(201);
      if (variantOfProductB.price !== null) {
        expect(variantLevel.body.price).toEqual({
          status: 'available',
          minPrice: variantOfProductB.price,
          maxPrice: variantOfProductB.price,
        });
      }
    });

    it('does not leak another user’s wishlist', async () => {
      const agentA = await signIn(TEST_PHONE_A, NORMALIZED_PHONE_A);
      const agentB = await signIn(TEST_PHONE_B, NORMALIZED_PHONE_B);

      await agentA
        .post('/wishlist')
        .send({ productId: productA.id })
        .expect(201);

      const listB = await agentB.get('/wishlist').expect(200);
      expect(listB.body.total).toBe(0);
      expect(listB.body.items).toEqual([]);
    });
  });

  describe('GET /wishlist/check', () => {
    it('reports whether a product/variant is in the wishlist', async () => {
      const agent = await signIn(TEST_PHONE_A, NORMALIZED_PHONE_A);

      const before = await agent
        .get(`/wishlist/check?productId=${productA.id}`)
        .expect(200);
      expect(before.body.inWishlist).toBe(false);
      expect(before.body.wishlistItemId).toBeNull();

      const added = await agent
        .post('/wishlist')
        .send({ productId: productA.id })
        .expect(201);

      const after = await agent
        .get(`/wishlist/check?productId=${productA.id}`)
        .expect(200);
      expect(after.body.inWishlist).toBe(true);
      expect(after.body.wishlistItemId).toBe(added.body.wishlistItemId);
    });
  });

  describe('PATCH /wishlist/:id (note)', () => {
    it('sets, edits, and clears a note', async () => {
      const agent = await signIn(TEST_PHONE_A, NORMALIZED_PHONE_A);
      const added = await agent
        .post('/wishlist')
        .send({ productId: productA.id })
        .expect(201);
      const id = added.body.wishlistItemId;

      const withNote = await agent
        .patch(`/wishlist/${id}`)
        .send({ note: 'برای مشورت با پزشک ذخیره کردم' })
        .expect(200);
      expect(withNote.body.note).toBe('برای مشورت با پزشک ذخیره کردم');

      const edited = await agent
        .patch(`/wishlist/${id}`)
        .send({ note: 'بین این مدل و مدل دیگر مرددم' })
        .expect(200);
      expect(edited.body.note).toBe('بین این مدل و مدل دیگر مرددم');

      const cleared = await agent
        .patch(`/wishlist/${id}`)
        .send({ note: null })
        .expect(200);
      expect(cleared.body.note).toBeNull();
    });

    it('rejects a note containing HTML', async () => {
      const agent = await signIn(TEST_PHONE_A, NORMALIZED_PHONE_A);
      const added = await agent
        .post('/wishlist')
        .send({ productId: productA.id })
        .expect(201);

      await agent
        .patch(`/wishlist/${added.body.wishlistItemId}`)
        .send({ note: '<script>alert(1)</script>' })
        .expect(400);
    });

    it('rejects a note over 500 characters', async () => {
      const agent = await signIn(TEST_PHONE_A, NORMALIZED_PHONE_A);
      const added = await agent
        .post('/wishlist')
        .send({ productId: productA.id })
        .expect(201);

      await agent
        .patch(`/wishlist/${added.body.wishlistItemId}`)
        .send({ note: 'a'.repeat(501) })
        .expect(400);
    });

    it('404s when updating a note on another user’s item', async () => {
      const agentA = await signIn(TEST_PHONE_A, NORMALIZED_PHONE_A);
      const agentB = await signIn(TEST_PHONE_B, NORMALIZED_PHONE_B);

      const added = await agentA
        .post('/wishlist')
        .send({ productId: productA.id })
        .expect(201);

      await agentB
        .patch(`/wishlist/${added.body.wishlistItemId}`)
        .send({ note: 'not mine' })
        .expect(404);
    });
  });

  describe('DELETE /wishlist/:id', () => {
    it('removes the item', async () => {
      const agent = await signIn(TEST_PHONE_A, NORMALIZED_PHONE_A);
      const added = await agent
        .post('/wishlist')
        .send({ productId: productA.id })
        .expect(201);

      await agent.delete(`/wishlist/${added.body.wishlistItemId}`).expect(204);

      const countRes = await agent.get('/wishlist/count').expect(200);
      expect(countRes.body.count).toBe(0);
    });

    it('404s deleting an item that does not belong to the current user', async () => {
      const agentA = await signIn(TEST_PHONE_A, NORMALIZED_PHONE_A);
      const agentB = await signIn(TEST_PHONE_B, NORMALIZED_PHONE_B);

      const added = await agentA
        .post('/wishlist')
        .send({ productId: productA.id })
        .expect(201);

      await agentB.delete(`/wishlist/${added.body.wishlistItemId}`).expect(404);

      const countRes = await agentA.get('/wishlist/count').expect(200);
      expect(countRes.body.count).toBe(1);
    });
  });
});
