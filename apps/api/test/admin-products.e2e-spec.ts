import { Test, TestingModule } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ThrottlerGuard } from '@nestjs/throttler';
import * as bcrypt from 'bcrypt';
import sharp from 'sharp';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { User, UserRole } from '../src/users/entities/user.entity';
import { AdminProfile } from '../src/auth/entities/admin-profile.entity';
import { Session } from '../src/auth/entities/session.entity';
import { Product } from '../src/catalog/entities/product.entity';
import { STORAGE_PROVIDER, StorageProvider, StoredFile } from '../src/storage/storage-provider.interface';
import { SMS_PROVIDER } from '../src/auth/sms/sms-provider.interface';

const ADMIN_PHONE_NORMALIZED = '+989300000020';
const PASSWORD = 'a-strong-password';

// In-memory fake so this suite never touches the real Arvan bucket -- same
// idea as the fake SMS provider in the auth e2e suites.
class InMemoryStorageProvider implements StorageProvider {
  private files = new Map<string, Buffer>();

  async save(key: string, data: Buffer): Promise<StoredFile> {
    this.files.set(key, data);
    return { url: this.resolveUrl(key) };
  }

  async delete(key: string): Promise<void> {
    this.files.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.files.has(key);
  }

  resolveUrl(key: string): string {
    return `https://cdn.test/${key}`;
  }
}

describe('Admin products + images (e2e)', () => {
  let app: NestExpressApplication;
  let userRepo: Repository<User>;
  let adminProfileRepo: Repository<AdminProfile>;
  let sessionRepo: Repository<Session>;
  let productRepo: Repository<Product>;
  let adminUserId: string;
  let agent: request.Agent;
  let testImage: Buffer;
  let sentCodes: Map<string, string>;

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
      .overrideProvider(STORAGE_PROVIDER)
      .useClass(InMemoryStorageProvider)
      .overrideProvider(SMS_PROVIDER)
      .useValue(testSmsProvider)
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();

    userRepo = moduleFixture.get(getRepositoryToken(User));
    adminProfileRepo = moduleFixture.get(getRepositoryToken(AdminProfile));
    sessionRepo = moduleFixture.get(getRepositoryToken(Session));
    productRepo = moduleFixture.get(getRepositoryToken(Product));

    testImage = await sharp({
      create: { width: 8, height: 8, channels: 3, background: { r: 200, g: 30, b: 30 } },
    })
      .png()
      .toBuffer();

    const user = await userRepo.save(
      userRepo.create({
        phone: ADMIN_PHONE_NORMALIZED,
        firstName: 'Admin',
        lastName: 'Test',
        role: UserRole.ADMIN,
      }),
    );
    adminUserId = user.id;
    await adminProfileRepo.save(
      adminProfileRepo.create({
        userId: user.id,
        passwordHash: await bcrypt.hash(PASSWORD, 4),
        activatedAt: new Date(),
      }),
    );

    // Logs in through the real password+OTP flow -- the login flow itself is
    // covered in depth by admin-auth.e2e-spec.ts, this just needs a valid
    // session to exercise the product/image endpoints.
    agent = request.agent(app.getHttpServer());
    await agent
      .post('/admin/auth/login-password')
      .send({ phone: ADMIN_PHONE_NORMALIZED, password: PASSWORD })
      .expect(200);
    const code = sentCodes.get(ADMIN_PHONE_NORMALIZED);
    await agent
      .post('/admin/auth/login-verify')
      .send({ phone: ADMIN_PHONE_NORMALIZED, code })
      .expect(200);
  });

  afterAll(async () => {
    await sessionRepo.delete({ userId: adminUserId });
    await adminProfileRepo.delete({ userId: adminUserId });
    await userRepo.delete({ id: adminUserId });
    await app.close();
  });

  it('creates a draft product, uploads/replaces/deletes images, and publishes it', async () => {
    const createRes = await agent
      .post('/admin/products')
      .send({ name: 'محصول تست ادمین' })
      .expect(201);

    const productId: string = createRes.body.id;
    expect(createRes.body.status).toBe('draft');
    expect(createRes.body.slug).toBeTruthy();

    try {
      const uploadRes = await agent
        .post(`/admin/products/${productId}/images`)
        .attach('files', testImage, 'test.png')
        .expect(201);

      expect(uploadRes.body).toHaveLength(1);
      const image = uploadRes.body[0];
      expect(image.objectKey).toContain(`products/${productId}/`);
      expect(image.thumbnailKey).toContain(`products/${productId}/`);
      expect(image.isPrimary).toBe(true);

      await agent
        .post(`/admin/products/${productId}/images`)
        .attach('files', testImage, 'second.png')
        .expect(201);

      const detail = await agent.get(`/admin/products/${productId}`).expect(200);
      expect(detail.body.images).toHaveLength(2);
      const secondImageId = detail.body.images.find((img: { isPrimary: boolean }) => !img.isPrimary).id;

      await agent
        .patch(`/admin/products/${productId}/images/${secondImageId}`)
        .send({ isPrimary: true })
        .expect(200);

      const replaceRes = await agent
        .post(`/admin/products/${productId}/images/${secondImageId}/replace`)
        .attach('file', testImage, 'replacement.png')
        .expect(201);
      expect(replaceRes.body.id).toBe(secondImageId);

      await agent.patch(`/admin/products/${productId}/approve`).expect(200);

      const publicRes = await request(app.getHttpServer())
        .get(`/products/${createRes.body.slug}`)
        .expect(200);
      expect(publicRes.body.images.length).toBeGreaterThan(0);
      expect(publicRes.body.images[0].url).toContain('https://cdn.test/');

      await agent
        .delete(`/admin/products/${productId}/images/${secondImageId}`)
        .expect(200);

      const afterDelete = await agent.get(`/admin/products/${productId}`).expect(200);
      expect(afterDelete.body.images).toHaveLength(1);
    } finally {
      await productRepo.delete({ id: productId });
    }
  });

  it('rejecting a product records the reason and keeps it out of the pending queue only once fixed', async () => {
    const createRes = await agent.post('/admin/products').send({ name: 'محصول در انتظار بررسی' }).expect(201);
    const productId: string = createRes.body.id;
    try {
      const pendingBefore = await agent.get('/admin/products/pending').expect(200);
      expect(pendingBefore.body.some((p: { id: string }) => p.id === productId)).toBe(true);

      const rejectRes = await agent
        .patch(`/admin/products/${productId}/reject`)
        .send({ reason: 'عکس محصول واضح نیست' })
        .expect(200);
      expect(rejectRes.body.status).toBe('draft');
      expect(rejectRes.body.rejectionReason).toBe('عکس محصول واضح نیست');

      // Still pending -- rejection sends it back for fixes, not out of the queue.
      const pendingAfterReject = await agent.get('/admin/products/pending').expect(200);
      expect(pendingAfterReject.body.some((p: { id: string }) => p.id === productId)).toBe(true);

      const approveRes = await agent.patch(`/admin/products/${productId}/approve`).expect(200);
      expect(approveRes.body.status).toBe('active');
      expect(approveRes.body.rejectionReason).toBeNull();

      const pendingAfterApprove = await agent.get('/admin/products/pending').expect(200);
      expect(pendingAfterApprove.body.some((p: { id: string }) => p.id === productId)).toBe(false);
    } finally {
      await productRepo.delete({ id: productId });
    }
  });

  it('rejects a non-image file upload', async () => {
    const createRes = await agent.post('/admin/products').send({ name: 'محصول دیگر' }).expect(201);
    try {
      await agent
        .post(`/admin/products/${createRes.body.id}/images`)
        .attach('files', Buffer.from('not an image'), 'fake.png')
        .expect(400);
    } finally {
      await productRepo.delete({ id: createRes.body.id });
    }
  });
});
