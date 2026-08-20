import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';

import { AuthService } from './auth.service';
import { OtpCode } from './entities/otp-code.entity';
import { Session } from './entities/session.entity';
import { UsersService } from '../users/users.service';
import { SMS_PROVIDER } from './sms/sms-provider.interface';
import { UserRole } from '../users/entities/user.entity';

const CONFIG_VALUES: Record<string, string> = {
  OTP_HASH_SECRET: 'test-secret',
  OTP_EXPIRY_MINUTES: '2',
  OTP_MAX_ATTEMPTS: '5',
  OTP_REQUEST_COOLDOWN_SECONDS: '60',
  SESSION_TTL_DAYS: '30',
};

function buildOtpRepositoryMock() {
  return {
    findOne: jest.fn(),
    save: jest.fn((entity) => Promise.resolve(entity)),
    create: jest.fn((entity) => entity),
  };
}

function buildSessionRepositoryMock() {
  return {
    findOne: jest.fn(),
    save: jest.fn((entity) => Promise.resolve(entity)),
    create: jest.fn((entity) => entity),
    delete: jest.fn(),
  };
}

async function buildTestingService(overrides?: {
  otpRepository?: ReturnType<typeof buildOtpRepositoryMock>;
  sessionRepository?: ReturnType<typeof buildSessionRepositoryMock>;
}) {
  const otpRepository = overrides?.otpRepository ?? buildOtpRepositoryMock();
  const sessionRepository =
    overrides?.sessionRepository ?? buildSessionRepositoryMock();
  const usersService = {
    findByPhone: jest.fn(),
    createByPhone: jest.fn(),
    findById: jest.fn(),
    setName: jest.fn(),
  };
  const smsProvider = {
    sendOtp: jest.fn().mockResolvedValue(undefined),
    sendWelcome: jest.fn().mockResolvedValue(undefined),
  };

  const moduleRef = await Test.createTestingModule({
    providers: [
      AuthService,
      { provide: getRepositoryToken(OtpCode), useValue: otpRepository },
      { provide: getRepositoryToken(Session), useValue: sessionRepository },
      { provide: UsersService, useValue: usersService },
      { provide: SMS_PROVIDER, useValue: smsProvider },
      {
        provide: ConfigService,
        useValue: {
          get: (key: string, fallback?: string) =>
            CONFIG_VALUES[key] ?? fallback,
        },
      },
    ],
  }).compile();

  return {
    service: moduleRef.get(AuthService),
    otpRepository,
    sessionRepository,
    usersService,
    smsProvider,
  };
}

describe('AuthService', () => {
  describe('requestOtp', () => {
    it('rejects a phone number that is not a valid Iranian mobile number', async () => {
      const { service } = await buildTestingService();

      await expect(service.requestOtp('123')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('creates an OTP row and sends it through the SMS provider', async () => {
      const { service, otpRepository, smsProvider } =
        await buildTestingService();
      otpRepository.findOne.mockResolvedValue(null);

      await service.requestOtp('09123456789');

      expect(otpRepository.save).toHaveBeenCalledTimes(1);
      expect(smsProvider.sendOtp).toHaveBeenCalledWith(
        '+989123456789',
        expect.stringMatching(/^\d{6}$/),
      );
    });

    it('does nothing when a recent OTP already exists (cooldown)', async () => {
      const { service, otpRepository, smsProvider } =
        await buildTestingService();
      otpRepository.findOne.mockResolvedValue({ id: 'existing' });

      await service.requestOtp('09123456789');

      expect(otpRepository.save).not.toHaveBeenCalled();
      expect(smsProvider.sendOtp).not.toHaveBeenCalled();
    });
  });

  describe('verifyOtp', () => {
    const genericErrorMessage = 'کد نامعتبر یا منقضی شده است';

    it('rejects when no OTP was ever requested for the phone', async () => {
      const { service, otpRepository } = await buildTestingService();
      otpRepository.findOne.mockResolvedValue(null);

      await expect(service.verifyOtp('09123456789', '000000')).rejects.toThrow(
        genericErrorMessage,
      );
    });

    it('rejects an expired OTP', async () => {
      const { service, otpRepository } = await buildTestingService();
      otpRepository.findOne.mockResolvedValue({
        codeHash: 'irrelevant',
        attemptCount: 0,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(service.verifyOtp('09123456789', '000000')).rejects.toThrow(
        genericErrorMessage,
      );
    });

    it('rejects once the attempt limit has been reached, without checking the code', async () => {
      const { service, otpRepository } = await buildTestingService();
      otpRepository.findOne.mockResolvedValue({
        codeHash: 'irrelevant',
        attemptCount: 5,
        expiresAt: new Date(Date.now() + 60_000),
      });

      await expect(service.verifyOtp('09123456789', '000000')).rejects.toThrow(
        genericErrorMessage,
      );
    });

    it('rejects a wrong code and increments the attempt count', async () => {
      const { service, otpRepository } = await buildTestingService();
      const otp = {
        codeHash: 'hash-of-the-real-code',
        attemptCount: 0,
        expiresAt: new Date(Date.now() + 60_000),
      };
      otpRepository.findOne.mockResolvedValue(otp);

      await expect(service.verifyOtp('09123456789', '000000')).rejects.toThrow(
        genericErrorMessage,
      );

      expect(otp.attemptCount).toBe(1);
      expect(otpRepository.save).toHaveBeenCalledWith(otp);
    });

    it('creates a user and a session on a correct, unexpired, unconsumed code', async () => {
      const {
        service,
        otpRepository,
        sessionRepository,
        usersService,
        smsProvider,
      } = await buildTestingService();

      await service.requestOtp('09123456789');
      const sentCode = (
        smsProvider.sendOtp.mock.calls[0] as [string, string]
      )[1];
      const savedOtp = otpRepository.save.mock.calls[0][0];
      otpRepository.findOne.mockResolvedValue(savedOtp);

      usersService.findByPhone.mockResolvedValue(null);
      usersService.createByPhone.mockResolvedValue({
        id: 'user-1',
        phone: '+989123456789',
        firstName: null,
        lastName: null,
        role: UserRole.CUSTOMER,
      });

      const result = await service.verifyOtp('09123456789', sentCode);

      expect(savedOtp.consumedAt).toBeInstanceOf(Date);
      expect(usersService.createByPhone).toHaveBeenCalledWith('+989123456789');
      expect(sessionRepository.save).toHaveBeenCalledTimes(1);
      expect(result.sessionToken).toEqual(
        expect.stringMatching(/^[0-9a-f]{64}$/),
      );
      expect(result.user.id).toBe('user-1');
      expect(result.isNewUser).toBe(true);
    });
  });

  describe('completeProfile', () => {
    it('sets the name and sends a welcome SMS the first time', async () => {
      const { service, usersService, smsProvider } =
        await buildTestingService();
      usersService.findById.mockResolvedValue({
        id: 'user-1',
        phone: '+989123456789',
        firstName: null,
        lastName: null,
        role: UserRole.CUSTOMER,
      });
      usersService.setName.mockResolvedValue({
        id: 'user-1',
        phone: '+989123456789',
        firstName: 'Ali',
        lastName: 'Rezaei',
        role: UserRole.CUSTOMER,
      });

      await service.completeProfile('user-1', 'Ali', 'Rezaei');

      expect(usersService.setName).toHaveBeenCalledWith(
        'user-1',
        'Ali',
        'Rezaei',
      );
      expect(smsProvider.sendWelcome).toHaveBeenCalledWith(
        '+989123456789',
        'Ali',
      );
    });

    it('does not send a welcome SMS when the name was already set', async () => {
      const { service, usersService, smsProvider } =
        await buildTestingService();
      usersService.findById.mockResolvedValue({
        id: 'user-1',
        phone: '+989123456789',
        firstName: 'Ali',
        lastName: 'Rezaei',
        role: UserRole.CUSTOMER,
      });
      usersService.setName.mockResolvedValue({
        id: 'user-1',
        phone: '+989123456789',
        firstName: 'Ali',
        lastName: 'Rezaei-Updated',
        role: UserRole.CUSTOMER,
      });

      await service.completeProfile('user-1', 'Ali', 'Rezaei-Updated');

      expect(smsProvider.sendWelcome).not.toHaveBeenCalled();
    });
  });

  describe('validateSessionToken', () => {
    it('returns null for an unknown token', async () => {
      const { service, sessionRepository } = await buildTestingService();
      sessionRepository.findOne.mockResolvedValue(null);

      await expect(service.validateSessionToken('nope')).resolves.toBeNull();
    });

    it('returns null for an expired session', async () => {
      const { service, sessionRepository } = await buildTestingService();
      sessionRepository.findOne.mockResolvedValue({
        expiresAt: new Date(Date.now() - 1000),
        user: { id: 'user-1' },
      });

      await expect(
        service.validateSessionToken('old-token'),
      ).resolves.toBeNull();
    });

    it('returns the user for a valid session', async () => {
      const { service, sessionRepository } = await buildTestingService();
      const user = {
        id: 'user-1',
        phone: '+989123456789',
        firstName: null,
        lastName: null,
        role: UserRole.CUSTOMER,
      };
      sessionRepository.findOne.mockResolvedValue({
        expiresAt: new Date(Date.now() + 60_000),
        user,
      });

      await expect(
        service.validateSessionToken('valid-token'),
      ).resolves.toEqual(user);
    });
  });

  describe('revokeSessionToken', () => {
    it('deletes the session by its token hash', async () => {
      const { service, sessionRepository } = await buildTestingService();

      await service.revokeSessionToken('some-token');

      expect(sessionRepository.delete).toHaveBeenCalledWith({
        tokenHash: expect.any(String),
      });
    });
  });
});
