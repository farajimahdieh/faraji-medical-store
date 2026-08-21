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

const TEST_PHONE = '09300000001';
const NORMALIZED_PHONE = '+989300000001';

describe('Auth (e2e)', () => {
  let app: NestExpressApplication;
  let userRepository: Repository<User>;
  let otpRepository: Repository<OtpCode>;
  let sessionRepository: Repository<Session>;
  let sentCodes: Map<string, string>;
  let welcomeMessages: Map<string, string>;

  beforeAll(async () => {
    sentCodes = new Map();
    welcomeMessages = new Map();
    const testSmsProvider = {
      sendOtp: async (phone: string, code: string) => {
        sentCodes.set(phone, code);
      },
      sendWelcome: async (phone: string, firstName: string) => {
        welcomeMessages.set(phone, firstName);
      },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SMS_PROVIDER)
      .useValue(testSmsProvider)
      // Rate limiting is exercised manually (see IMPLEMENTATION SUMMARY);
      // disabling it here keeps this suite's flow tests independent of timing.
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();

    userRepository = moduleFixture.get(getRepositoryToken(User));
    otpRepository = moduleFixture.get(getRepositoryToken(OtpCode));
    sessionRepository = moduleFixture.get(getRepositoryToken(Session));
  });

  afterAll(async () => {
    await cleanupTestPhone();
    await app.close();
  });

  beforeEach(async () => {
    await cleanupTestPhone();
    sentCodes.clear();
    welcomeMessages.clear();
  });

  async function cleanupTestPhone(): Promise<void> {
    await otpRepository.delete({ phone: NORMALIZED_PHONE });
    const user = await userRepository.findOneBy({ phone: NORMALIZED_PHONE });
    if (user) {
      await sessionRepository.delete({ userId: user.id });
      await userRepository.delete({ id: user.id });
    }
  }

  it('rejects /auth/me with no session cookie', () => {
    return request(app.getHttpServer()).get('/auth/me').expect(401);
  });

  it('rejects a malformed phone number on request', () => {
    return request(app.getHttpServer())
      .post('/auth/otp/request')
      .send({ phone: '123' })
      .expect(400);
  });

  it('rejects a wrong OTP code with a generic message', async () => {
    await request(app.getHttpServer())
      .post('/auth/otp/request')
      .send({ phone: TEST_PHONE })
      .expect(200);

    const response = await request(app.getHttpServer())
      .post('/auth/otp/verify')
      .send({ phone: TEST_PHONE, code: '000000' })
      .expect(400);

    expect(response.body.message).toBe('کد نامعتبر یا منقضی شده است');
  });

  it('completes the full request -> verify -> me -> logout -> me flow', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/auth/otp/request')
      .send({ phone: TEST_PHONE })
      .expect(200);

    const code = sentCodes.get(NORMALIZED_PHONE);
    expect(code).toMatch(/^\d{6}$/);

    const verifyResponse = await agent
      .post('/auth/otp/verify')
      .send({ phone: TEST_PHONE, code })
      .expect(200);

    expect(verifyResponse.body.user.phone).toBe(NORMALIZED_PHONE);
    expect(verifyResponse.body.isNewUser).toBe(true);
    expect(verifyResponse.headers['set-cookie']?.[0]).toContain('HttpOnly');

    const meResponse = await agent.get('/auth/me').expect(200);
    expect(meResponse.body.user.phone).toBe(NORMALIZED_PHONE);

    await agent.post('/auth/logout').expect(204);

    await agent.get('/auth/me').expect(401);
  });

  it('completes profile once and sends a welcome SMS only the first time', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/auth/otp/request')
      .send({ phone: TEST_PHONE })
      .expect(200);
    const firstCode = sentCodes.get(NORMALIZED_PHONE);
    await agent
      .post('/auth/otp/verify')
      .send({ phone: TEST_PHONE, code: firstCode })
      .expect(200);

    const profileResponse = await agent
      .patch('/auth/profile')
      .send({ firstName: 'Ali', lastName: 'Rezaei' })
      .expect(200);

    expect(profileResponse.body.user.firstName).toBe('Ali');
    expect(welcomeMessages.get(NORMALIZED_PHONE)).toBe('Ali');

    await agent.post('/auth/logout').expect(204);
    welcomeMessages.clear();

    // Log back in and verify a returning user is flagged correctly, and
    // completing the profile again does not re-send the welcome SMS.
    await agent
      .post('/auth/otp/request')
      .send({ phone: TEST_PHONE })
      .expect(200);
    const secondCode = sentCodes.get(NORMALIZED_PHONE);
    const secondVerify = await agent
      .post('/auth/otp/verify')
      .send({ phone: TEST_PHONE, code: secondCode })
      .expect(200);

    expect(secondVerify.body.isNewUser).toBe(false);

    await agent
      .patch('/auth/profile')
      .send({ firstName: 'Ali', lastName: 'Rezaei' })
      .expect(200);

    expect(welcomeMessages.has(NORMALIZED_PHONE)).toBe(false);
  });

  it('rejects /auth/profile without a session', () => {
    return request(app.getHttpServer())
      .patch('/auth/profile')
      .send({ firstName: 'Ali', lastName: 'Rezaei' })
      .expect(401);
  });

  it('rejects reusing an already-consumed OTP code', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/auth/otp/request')
      .send({ phone: TEST_PHONE })
      .expect(200);
    const code = sentCodes.get(NORMALIZED_PHONE);

    await agent
      .post('/auth/otp/verify')
      .send({ phone: TEST_PHONE, code })
      .expect(200);

    const response = await agent
      .post('/auth/otp/verify')
      .send({ phone: TEST_PHONE, code })
      .expect(400);

    expect(response.body.message).toBe('کد نامعتبر یا منقضی شده است');
  });
});
