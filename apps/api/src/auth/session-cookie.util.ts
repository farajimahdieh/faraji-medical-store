import { ConfigService } from '@nestjs/config';
import { CookieOptions } from 'express';

export function getSessionCookieName(configService: ConfigService): string {
  return configService.get<string>('SESSION_COOKIE_NAME', 'session_token');
}

export function getSessionCookieOptions(
  configService: ConfigService,
): CookieOptions {
  const isProduction = configService.get('NODE_ENV') === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
  };
}
