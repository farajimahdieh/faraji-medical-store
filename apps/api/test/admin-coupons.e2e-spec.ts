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
import { Session } from '../src/auth/entities/session.entity';
import { OtpCode } from '../src/auth/entities/otp-code.entity';
import { DiscountCode } from '../src/coupons/entities/discount-code.entity';
import { AuditLog } from '../src/admin/entities/audit-log.entity';
import { SMS_PROVIDER } from '../src/auth/sms/sms-provider.interface';

const ADMIN_PHONE = '09300000030';
const ADMIN_PHONE_NORMALIZED = '+989300000030';
const CUSTOMER_PHONE = '09300000031';
const CUSTOMER_PHONE_NORMALIZED = '+989300000031';
const PASSWORD = 'a-strong-password';

describe('Admin coupons + staff redemption block (e2e)', () => {
  let app: NestExpressApplication;
  let userRepo: Repository<User>;
  let adminProfileRepo: Repository<AdminProfile>;
  let sessionRepo: Repository<Session>;
  let otpRepo: Repository<OtpCode>;
  let discountCodeRepo: Repository<DiscountCode>;
  let auditLogRepo: Repository<AuditLog>;
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
    otpRepo = moduleFixture.get(getRepositoryToken(OtpCode));
    discountCodeRepo = moduleFixture.get(getRepositoryToken(DiscountCode));
    auditLogRepo = moduleFixture.get(getRepositoryToken(AuditLog));
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  beforeEach(async () => {
    await cleanup();
    sentCodes.clear();
    const admin = await userRepo.save(
      userRepo.create({ phone: ADMIN_PHONE_NORMALIZED, firstName: 'A', lastName: 'B', role: UserRole.ADMIN }),
    );
    await adminProfileRepo.save(
      adminProfileRepo.create({
        userId: admin.id,
        passwordHash: await bcrypt.hash(PASSWORD, 4),
        activatedAt: new Date(),
      }),
    );
  });

  async function cleanup(): Promise<void> {
    for (const phone of [ADMIN_PHONE_NORMALIZED, CUSTOMER_PHONE_NORMALIZED]) {
      await otpRepo.delete({ phone });
      const user = await userRepo.findOneBy({ phone });
      if (user) {
        await sessionRepo.delete({ userId: user.id });
        await adminProfileRepo.delete({ userId: user.id });
        await userRepo.delete({ id: user.id });
      }
    }
    await discountCodeRepo.delete({ code: 'E2E-TEST-CODE' });
  }

  async function loginAsAdmin(agent: request.Agent): Promise<void> {
    await agent
      .post('/admin/auth/login-password')
      .send({ phone: ADMIN_PHONE_NORMALIZED, password: PASSWORD })
      .expect(200);
    const code = sentCodes.get(ADMIN_PHONE_NORMALIZED);
    await agent.post('/admin/auth/login-verify').send({ phone: ADMIN_PHONE_NORMALIZED, code }).expect(200);
  }

  async function loginAsCustomer(agent: request.Agent): Promise<void> {
    await agent.post('/auth/otp/request').send({ phone: CUSTOMER_PHONE }).expect(200);
    const code = sentCodes.get(CUSTOMER_PHONE_NORMALIZED);
    await agent.post('/auth/otp/verify').send({ phone: CUSTOMER_PHONE, code }).expect(200);
  }

  it('admin can create and activate a coupon; it gets audited; staff is blocked from applying it, a customer is not', async () => {
    const adminAgent = request.agent(app.getHttpServer());
    await loginAsAdmin(adminAgent);

    const createRes = await adminAgent
      .post('/admin/coupons')
      .send({ code: 'e2e-test-code', type: 'fixed_amount', value: 1000 })
      .expect(201);
    expect(createRes.body.isActive).toBe(true);

    const auditRow = await auditLogRepo.findOne({
      where: { entityType: 'coupon', entityId: createRes.body.id },
    });
    expect(auditRow?.action).toBe('coupon.create');

    // Staff (admin role) is blocked from redeeming the coupon in their own cart.
    const staffCouponRes = await adminAgent
      .post('/cart/coupon')
      .send({ code: 'E2E-TEST-CODE' })
      .expect(400);
    expect(staffCouponRes.body.message).toContain('مشتریان');

    // A real customer can apply the same coupon successfully.
    const customerAgent = request.agent(app.getHttpServer());
    await loginAsCustomer(customerAgent);
    const customerRes = await customerAgent
      .post('/cart/coupon')
      .send({ code: 'E2E-TEST-CODE' })
      .expect(201);
    expect(customerRes.body.coupon?.code).toBe('E2E-TEST-CODE');
  });
});
