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
import { SMS_PROVIDER } from '../src/auth/sms/sms-provider.interface';

const ADMIN_PHONE = '09300000010';
const ADMIN_PHONE_NORMALIZED = '+989300000010';
const SUPER_ADMIN_PHONE = '09300000011';
const SUPER_ADMIN_PHONE_NORMALIZED = '+989300000011';
const CUSTOMER_PHONE = '09300000012';
const CUSTOMER_PHONE_NORMALIZED = '+989300000012';
const PASSWORD = 'a-strong-password';

describe('Admin auth + RBAC (e2e)', () => {
  let app: NestExpressApplication;
  let userRepo: Repository<User>;
  let adminProfileRepo: Repository<AdminProfile>;
  let sessionRepo: Repository<Session>;
  let otpRepo: Repository<OtpCode>;
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
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  beforeEach(async () => {
    await cleanup();
    sentCodes.clear();
    await seedAdmin(ADMIN_PHONE_NORMALIZED, UserRole.ADMIN);
    await seedAdmin(SUPER_ADMIN_PHONE_NORMALIZED, UserRole.SUPER_ADMIN);
  });

  async function cleanup(): Promise<void> {
    for (const phone of [
      ADMIN_PHONE_NORMALIZED,
      SUPER_ADMIN_PHONE_NORMALIZED,
      CUSTOMER_PHONE_NORMALIZED,
    ]) {
      await otpRepo.delete({ phone });
      const user = await userRepo.findOneBy({ phone });
      if (user) {
        await sessionRepo.delete({ userId: user.id });
        await adminProfileRepo.delete({ userId: user.id });
        await userRepo.delete({ id: user.id });
      }
    }
  }

  async function seedAdmin(phone: string, role: UserRole): Promise<User> {
    const user = await userRepo.save(
      userRepo.create({ phone, firstName: 'Admin', lastName: 'Test', role }),
    );
    await adminProfileRepo.save(
      adminProfileRepo.create({
        userId: user.id,
        passwordHash: await bcrypt.hash(PASSWORD, 4),
      }),
    );
    return user;
  }

  async function loginAsAdmin(phone: string, agent: request.Agent): Promise<void> {
    await agent
      .post('/admin/auth/login-password')
      .send({ phone, password: PASSWORD })
      .expect(200);
    const code = sentCodes.get(phone);
    expect(code).toMatch(/^\d{6}$/);
    await agent.post('/admin/auth/login-verify').send({ phone, code }).expect(200);
  }

  it('rejects /admin/products with no session', () => {
    return request(app.getHttpServer()).get('/admin/products').expect(401);
  });

  it('logs an admin in with password + OTP and grants access to admin routes', async () => {
    const agent = request.agent(app.getHttpServer());
    await loginAsAdmin(ADMIN_PHONE_NORMALIZED, agent);

    const me = await agent.get('/auth/me').expect(200);
    expect(me.body.user.role).toBe('admin');

    await agent.get('/admin/products').expect(200);
  });

  it('never sends an OTP for a wrong password, and login-verify then fails', async () => {
    const agent = request.agent(app.getHttpServer());
    await agent
      .post('/admin/auth/login-password')
      .send({ phone: ADMIN_PHONE_NORMALIZED, password: 'wrong-password' })
      .expect(200); // generic response either way

    expect(sentCodes.has(ADMIN_PHONE_NORMALIZED)).toBe(false);

    await agent
      .post('/admin/auth/login-verify')
      .send({ phone: ADMIN_PHONE_NORMALIZED, code: '000000' })
      .expect(400);
  });

  it('rejects a customer session on admin routes', async () => {
    const agent = request.agent(app.getHttpServer());
    await agent
      .post('/auth/otp/request')
      .send({ phone: CUSTOMER_PHONE })
      .expect(200);
    const code = sentCodes.get(CUSTOMER_PHONE_NORMALIZED);
    await agent.post('/auth/otp/verify').send({ phone: CUSTOMER_PHONE, code }).expect(200);

    await agent.get('/admin/products').expect(403);
  });

  it('lets a super_admin manage admins but blocks a plain admin from the same route', async () => {
    const superAgent = request.agent(app.getHttpServer());
    await loginAsAdmin(SUPER_ADMIN_PHONE_NORMALIZED, superAgent);
    await superAgent.get('/admin/admins').expect(200);

    const adminAgent = request.agent(app.getHttpServer());
    await loginAsAdmin(ADMIN_PHONE_NORMALIZED, adminAgent);
    await adminAgent.get('/admin/admins').expect(403);
  });
});
