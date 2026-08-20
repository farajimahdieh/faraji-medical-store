import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { createHash, createHmac, randomBytes, randomInt } from 'crypto';

import { OtpCode } from './entities/otp-code.entity';
import { Session } from './entities/session.entity';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { normalizeIranPhone } from '../common/phone.util';
import { SMS_PROVIDER } from './sms/sms-provider.interface';
import type { SmsProvider } from './sms/sms-provider.interface';

interface VerifyOtpResult {
  user: User;
  isNewUser: boolean;
  sessionToken: string;
  sessionExpiresAt: Date;
}

const INVALID_OTP_MESSAGE = 'کد نامعتبر یا منقضی شده است';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(OtpCode)
    private readonly otpRepository: Repository<OtpCode>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    @Inject(SMS_PROVIDER)
    private readonly smsProvider: SmsProvider,
  ) {}

  async requestOtp(rawPhone: string): Promise<void> {
    const phone = this.normalizeOrThrow(rawPhone);

    const cooldownSeconds = Number(
      this.configService.get('OTP_REQUEST_COOLDOWN_SECONDS', '60'),
    );
    const cooldownStart = new Date(Date.now() - cooldownSeconds * 1000);

    const recentOtp = await this.otpRepository.findOne({
      where: { phone, createdAt: MoreThan(cooldownStart) },
      order: { createdAt: 'DESC' },
    });

    // Still inside cooldown: stay silent and return the same response as a
    // fresh request, so a caller can't tell OTP-sent from cooldown-active.
    if (recentOtp) {
      return;
    }

    const code = this.generateCode();
    const expiryMinutes = Number(
      this.configService.get('OTP_EXPIRY_MINUTES', '2'),
    );

    await this.otpRepository.save(
      this.otpRepository.create({
        phone,
        codeHash: this.hashCode(code),
        expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000),
      }),
    );

    await this.smsProvider.sendOtp(phone, code);
  }

  async verifyOtp(rawPhone: string, code: string): Promise<VerifyOtpResult> {
    const phone = this.normalizeOrThrow(rawPhone);

    const otp = await this.otpRepository.findOne({
      where: { phone, consumedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });

    if (!otp || otp.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException(INVALID_OTP_MESSAGE);
    }

    const maxAttempts = Number(this.configService.get('OTP_MAX_ATTEMPTS', '5'));
    if (otp.attemptCount >= maxAttempts) {
      throw new BadRequestException(INVALID_OTP_MESSAGE);
    }

    if (otp.codeHash !== this.hashCode(code)) {
      otp.attemptCount += 1;
      await this.otpRepository.save(otp);
      throw new BadRequestException(INVALID_OTP_MESSAGE);
    }

    otp.consumedAt = new Date();
    await this.otpRepository.save(otp);

    const existingUser = await this.usersService.findByPhone(phone);
    const user = existingUser ?? (await this.usersService.createByPhone(phone));

    const session = await this.createSession(user.id);

    return {
      user,
      isNewUser: !existingUser,
      sessionToken: session.token,
      sessionExpiresAt: session.expiresAt,
    };
  }

  async completeProfile(
    userId: string,
    firstName: string,
    lastName: string,
  ): Promise<User> {
    const beforeUpdate = await this.usersService.findById(userId);
    const isFirstTimeNamed = !beforeUpdate?.firstName;

    const user = await this.usersService.setName(userId, firstName, lastName);

    if (isFirstTimeNamed) {
      await this.smsProvider.sendWelcome(user.phone, firstName);
    }

    return user;
  }

  async validateSessionToken(token: string): Promise<User | null> {
    const tokenHash = this.hashToken(token);
    const session = await this.sessionRepository.findOne({
      where: { tokenHash },
      relations: { user: true },
    });

    if (!session || session.expiresAt.getTime() < Date.now()) {
      return null;
    }

    return session.user;
  }

  async revokeSessionToken(token: string): Promise<void> {
    await this.sessionRepository.delete({ tokenHash: this.hashToken(token) });
  }

  private async createSession(
    userId: string,
  ): Promise<{ token: string; expiresAt: Date }> {
    const token = randomBytes(32).toString('hex');
    const ttlDays = Number(this.configService.get('SESSION_TTL_DAYS', '30'));
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

    await this.sessionRepository.save(
      this.sessionRepository.create({
        userId,
        tokenHash: this.hashToken(token),
        expiresAt,
      }),
    );

    return { token, expiresAt };
  }

  private normalizeOrThrow(rawPhone: string): string {
    const phone = normalizeIranPhone(rawPhone);
    if (!phone) {
      throw new BadRequestException('شماره موبایل نامعتبر است');
    }
    return phone;
  }

  private generateCode(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }

  private hashCode(code: string): string {
    const secret = this.configService.get<string>('OTP_HASH_SECRET', '');
    return createHmac('sha256', secret).update(code).digest('hex');
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
