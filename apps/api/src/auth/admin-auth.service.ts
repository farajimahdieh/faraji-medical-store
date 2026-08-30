import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { AdminProfile } from './entities/admin-profile.entity';
import { OtpPurpose } from './entities/otp-code.entity';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

const INVALID_LOGIN_MESSAGE = 'اطلاعات ورود نامعتبر است';
const BCRYPT_ROUNDS = 12;

interface AdminLoginVerifyResult {
  user: User;
  sessionToken: string;
  sessionExpiresAt: Date;
}

@Injectable()
export class AdminAuthService {
  constructor(
    @InjectRepository(AdminProfile)
    private readonly adminProfileRepository: Repository<AdminProfile>,
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  // Step 1+2 of admin login: phone + password. Never reveals which part
  // was wrong (unknown phone, wrong password, disabled, locked) -- always
  // resolves, and only actually sends an OTP when everything checks out.
  async loginWithPassword(rawPhone: string, password: string): Promise<void> {
    const phone = this.authService.normalizeOrThrow(rawPhone);
    const profile = await this.findActiveProfileByPhone(phone);
    if (!profile) return;

    if (profile.lockedUntil && profile.lockedUntil.getTime() > Date.now()) {
      return;
    }

    // findActiveProfileByPhone already excludes profiles with no
    // passwordHash (still-pending invites).
    const passwordMatches = await bcrypt.compare(
      password,
      profile.passwordHash!,
    );
    if (!passwordMatches) {
      await this.registerFailedAttempt(profile);
      return;
    }

    profile.failedLoginAttempts = 0;
    profile.lockedUntil = null;
    await this.adminProfileRepository.save(profile);

    await this.authService.requestOtp(phone, OtpPurpose.ADMIN_LOGIN);
  }

  // Step 3: OTP verification. Creates the same kind of session a customer
  // login would (see SessionGuard/RolesGuard for how the role is enforced
  // afterward).
  async verifyLogin(
    rawPhone: string,
    code: string,
  ): Promise<AdminLoginVerifyResult> {
    const phone = this.authService.normalizeOrThrow(rawPhone);
    await this.authService.consumeOtp(phone, code, OtpPurpose.ADMIN_LOGIN);

    const profile = await this.findActiveProfileByPhone(phone);
    if (!profile) {
      throw new BadRequestException(INVALID_LOGIN_MESSAGE);
    }

    profile.lastLoginAt = new Date();
    await this.adminProfileRepository.save(profile);

    const session = await this.authService.createSession(profile.userId);
    const user = await this.usersService.findById(profile.userId);
    return {
      user: user!,
      sessionToken: session.token,
      sessionExpiresAt: session.expiresAt,
    };
  }

  // Step 1 of activation: an invited admin (passwordHash still null)
  // requests an OTP on their own phone. Same non-enumeration stance as
  // everywhere else -- silent no-op for any phone that isn't a pending
  // invite.
  async requestActivation(rawPhone: string): Promise<void> {
    const phone = this.authService.normalizeOrThrow(rawPhone);
    const profile = await this.findPendingProfileByPhone(phone);
    if (!profile) return;

    await this.authService.requestOtp(phone, OtpPurpose.ADMIN_ACTIVATION);
  }

  // Step 2: verify the OTP and let the admin set their own permanent
  // password in the same request -- activates the account and logs them
  // straight in, same as a normal login would.
  async activate(
    rawPhone: string,
    code: string,
    password: string,
  ): Promise<AdminLoginVerifyResult> {
    const phone = this.authService.normalizeOrThrow(rawPhone);
    await this.authService.consumeOtp(phone, code, OtpPurpose.ADMIN_ACTIVATION);

    const profile = await this.findPendingProfileByPhone(phone);
    if (!profile) {
      throw new BadRequestException(INVALID_LOGIN_MESSAGE);
    }

    profile.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    profile.activatedAt = new Date();
    profile.lastLoginAt = new Date();
    await this.adminProfileRepository.save(profile);

    const session = await this.authService.createSession(profile.userId);
    const user = await this.usersService.findById(profile.userId);
    return {
      user: user!,
      sessionToken: session.token,
      sessionExpiresAt: session.expiresAt,
    };
  }

  private async findPendingProfileByPhone(
    phone: string,
  ): Promise<AdminProfile | null> {
    const user = await this.usersService.findByPhone(phone);
    if (!user) return null;

    const profile = await this.adminProfileRepository.findOne({
      where: { userId: user.id },
    });
    if (!profile || !profile.isActive || profile.activatedAt) return null;

    return profile;
  }

  private async findActiveProfileByPhone(
    phone: string,
  ): Promise<AdminProfile | null> {
    const user = await this.usersService.findByPhone(phone);
    if (!user) return null;

    const profile = await this.adminProfileRepository.findOne({
      where: { userId: user.id },
    });
    // Not active, or still pending activation (no password set yet).
    if (!profile || !profile.isActive || !profile.passwordHash) return null;

    return profile;
  }

  private async registerFailedAttempt(profile: AdminProfile): Promise<void> {
    const maxAttempts = Number(
      this.configService.get('ADMIN_LOGIN_MAX_ATTEMPTS', '5'),
    );
    const lockoutMinutes = Number(
      this.configService.get('ADMIN_LOGIN_LOCKOUT_MINUTES', '15'),
    );

    profile.failedLoginAttempts += 1;
    if (profile.failedLoginAttempts >= maxAttempts) {
      profile.lockedUntil = new Date(Date.now() + lockoutMinutes * 60 * 1000);
    }
    await this.adminProfileRepository.save(profile);
  }
}
