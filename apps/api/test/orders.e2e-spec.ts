import { Test, TestingModule } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ThrottlerGuard } from '@nestjs/throttler';
import * as bcrypt from 'bcrypt';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { User, UserRole } from '../src/users/entities/user.entity';
import { AdminProfile } from '../src/auth/entities/admin-profile.entity';
import { OtpCode } from '../src/auth/entities/otp-code.entity';
import { Product, ProductStatus } from '../src/catalog/entities/product.entity';
import { ProductVariant } from '../src/catalog/entities/product-variant.entity';
import { Order } from '../src/orders/entities/order.entity';
import { SMS_PROVIDER } from '../src/auth/sms/sms-provider.interface';

const CUSTOMER_PHONE = '09300000031';
const CUSTOMER_NORMALIZED = '+989300000031';
const ADMIN_PHONE = '09300000032';
const ADMIN_NORMALIZED = '+989300000032';
const PASSWORD = 'a-strong-password';
const SLUG = 'e2e-offline-payment-product';

describe('Orders with offline payment (e2e)', () => {
  let app: NestExpressApplication;
  let userRepo: Repository<User>;
  let otpRepo: Repository<OtpCode>;
  let productRepo: Repository<Product>;
  let orderRepo: Repository<Order>;
  let variant: ProductVariant;
  const sentCodes = new Map<string, string>();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SMS_PROVIDER)
      .useValue({
        sendOtp: async (phone: string, code: string) => {
          sentCodes.set(phone, code);
        },
        sendWelcome: async () => undefined,
      })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();

    userRepo = moduleFixture.get(getRepositoryToken(User));
    otpRepo = moduleFixture.get(getRepositoryToken(OtpCode));
    productRepo = moduleFixture.get(getRepositoryToken(Product));
    orderRepo = moduleFixture.get(getRepositoryToken(Order));
    const variantRepo: Repository<ProductVariant> = moduleFixture.get(
      getRepositoryToken(ProductVariant),
    );
    const adminProfileRepo: Repository<AdminProfile> = moduleFixture.get(
      getRepositoryToken(AdminProfile),
    );

    await cleanup();
    const product = await productRepo.save(
      productRepo.create({
        name: 'محصول آزمایشی',
        slug: SLUG,
        status: ProductStatus.ACTIVE,
      }),
    );
    variant = await variantRepo.save(
      variantRepo.create({
        productId: product.id,
        size: 'استاندارد',
        price: 50_000,
        stock: 10,
      }),
    );
    const admin = await userRepo.save(
      userRepo.create({ phone: ADMIN_NORMALIZED, role: UserRole.ADMIN }),
    );
    await adminProfileRepo.save(
      adminProfileRepo.create({
        userId: admin.id,
        passwordHash: await bcrypt.hash(PASSWORD, 4),
        activatedAt: new Date(),
      }),
    );
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  async function cleanup(): Promise<void> {
    for (const phone of [CUSTOMER_NORMALIZED, ADMIN_NORMALIZED]) {
      await otpRepo.delete({ phone });
      const user = await userRepo.findOneBy({ phone });
      if (user) {
        await orderRepo.delete({ userId: user.id });
        await userRepo.delete({ id: user.id }); // cascades sessions/profile/cart
      }
    }
    await productRepo.delete({ slug: SLUG });
  }

  async function customerAgent() {
    const agent = request.agent(app.getHttpServer());
    await agent
      .post('/auth/otp/request')
      .send({ phone: CUSTOMER_PHONE })
      .expect(200);
    await agent
      .post('/auth/otp/verify')
      .send({ phone: CUSTOMER_PHONE, code: sentCodes.get(CUSTOMER_NORMALIZED) })
      .expect(200);
    return agent;
  }

  it('takes an in-store pickup order unpaid, and lets an admin mark it paid', async () => {
    const customer = await customerAgent();
    await customer
      .post('/cart/items')
      .send({ variantId: variant.id, quantity: 2 })
      .expect(201);

    const created = await customer
      .post('/orders')
      .send({ paymentMethod: 'pay_at_store' })
      .expect(201);
    expect(created.body).toMatchObject({
      status: 'processing',
      paymentStatus: 'pending',
      paymentMethod: 'pay_at_store',
      totalAmount: 100_000,
      address: { recipientPhone: CUSTOMER_NORMALIZED, city: null },
    });

    // The customer cannot change their own order's status.
    await customer
      .patch(`/admin/orders/${created.body.id}/status`)
      .send({ paymentStatus: 'paid' })
      .expect(403);

    const admin = request.agent(app.getHttpServer());
    await admin
      .post('/admin/auth/login-password')
      .send({ phone: ADMIN_PHONE, password: PASSWORD })
      .expect(200);
    await admin
      .post('/admin/auth/login-verify')
      .send({ phone: ADMIN_PHONE, code: sentCodes.get(ADMIN_NORMALIZED) })
      .expect(200);

    const updated = await admin
      .patch(`/admin/orders/${created.body.id}/status`)
      .send({ status: 'delivered', paymentStatus: 'paid' })
      .expect(200);
    expect(updated.body).toMatchObject({
      status: 'delivered',
      paymentStatus: 'paid',
    });
  });

  it('requires an address for cash on delivery', async () => {
    const customer = await customerAgent();
    await customer
      .post('/cart/items')
      .send({ variantId: variant.id, quantity: 1 })
      .expect(201);

    await customer
      .post('/orders')
      .send({ paymentMethod: 'cash_on_delivery' })
      .expect(400);
  });

  it('rejects an unknown payment method', async () => {
    const customer = await customerAgent();
    await customer
      .post('/orders')
      .send({ paymentMethod: 'online' })
      .expect(400);
  });
});
