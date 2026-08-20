import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { SessionGuard } from './guards/session.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import {
  getSessionCookieName,
  getSessionCookieOptions,
} from './session-cookie.util';
import { User } from '../users/entities/user.entity';
import { toPublicUser } from '../users/user.public';

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('otp/request')
  @HttpCode(200)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  async requestOtp(@Body() dto: RequestOtpDto): Promise<{ message: string }> {
    await this.authService.requestOtp(dto.phone);
    return { message: 'در صورت معتبر بودن شماره، کد ارسال شد' };
  }

  @Post('otp/verify')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.verifyOtp(dto.phone, dto.code);

    response.cookie(
      getSessionCookieName(this.configService),
      result.sessionToken,
      {
        ...getSessionCookieOptions(this.configService),
        expires: result.sessionExpiresAt,
      },
    );

    return { user: toPublicUser(result.user), isNewUser: result.isNewUser };
  }

  @Get('me')
  @UseGuards(SessionGuard)
  me(@CurrentUser() user: User) {
    return { user: toPublicUser(user) };
  }

  @Patch('profile')
  @UseGuards(SessionGuard)
  async completeProfile(
    @CurrentUser() user: User,
    @Body() dto: CompleteProfileDto,
  ) {
    const updated = await this.authService.completeProfile(
      user.id,
      dto.firstName,
      dto.lastName,
    );
    return { user: toPublicUser(updated) };
  }

  @Post('logout')
  @HttpCode(204)
  @UseGuards(SessionGuard)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const cookieName = getSessionCookieName(this.configService);
    const token = request.cookies?.[cookieName] as string | undefined;

    if (token) {
      await this.authService.revokeSessionToken(token);
    }

    response.clearCookie(
      cookieName,
      getSessionCookieOptions(this.configService),
    );
  }
}
