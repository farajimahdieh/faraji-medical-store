import {
  Body,
  Controller,
  HttpCode,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Response } from 'express';

import { AdminAuthService } from './admin-auth.service';
import { AdminLoginPasswordDto } from './dto/admin-login-password.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ActivateAdminDto } from './dto/activate-admin.dto';
import {
  getSessionCookieName,
  getSessionCookieOptions,
} from './session-cookie.util';
import { toPublicUser } from '../users/user.public';

@Controller('admin/auth')
@UseGuards(ThrottlerGuard)
export class AdminAuthController {
  constructor(
    private readonly adminAuthService: AdminAuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login-password')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async loginPassword(
    @Body() dto: AdminLoginPasswordDto,
  ): Promise<{ message: string }> {
    await this.adminAuthService.loginWithPassword(dto.phone, dto.password);
    return { message: 'در صورت معتبر بودن اطلاعات، کد تایید پیامک شد' };
  }

  @Post('login-verify')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async loginVerify(
    @Body() dto: VerifyOtpDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.adminAuthService.verifyLogin(dto.phone, dto.code);

    response.cookie(
      getSessionCookieName(this.configService),
      result.sessionToken,
      {
        ...getSessionCookieOptions(this.configService),
        expires: result.sessionExpiresAt,
      },
    );

    return { user: toPublicUser(result.user) };
  }

  @Post('activate-request')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async activateRequest(
    @Body() dto: RequestOtpDto,
  ): Promise<{ message: string }> {
    await this.adminAuthService.requestActivation(dto.phone);
    return { message: 'در صورت معتبر بودن دعوت، کد تایید پیامک شد' };
  }

  @Post('activate-verify')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async activateVerify(
    @Body() dto: ActivateAdminDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.adminAuthService.activate(
      dto.phone,
      dto.code,
      dto.password,
    );

    response.cookie(
      getSessionCookieName(this.configService),
      result.sessionToken,
      {
        ...getSessionCookieOptions(this.configService),
        expires: result.sessionExpiresAt,
      },
    );

    return { user: toPublicUser(result.user) };
  }
}
