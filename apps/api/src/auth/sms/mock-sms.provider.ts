import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SmsProvider } from './sms-provider.interface';

@Injectable()
export class MockSmsProvider implements SmsProvider {
  private readonly logger = new Logger(MockSmsProvider.name);

  constructor(private readonly configService: ConfigService) {}

  sendOtp(phone: string, code: string): Promise<void> {
    this.logger.warn(`[DEV ONLY - no real SMS sent] OTP for ${phone}: ${code}`);
    return Promise.resolve();
  }

  sendWelcome(phone: string, firstName: string): Promise<void> {
    const storeName = this.configService.get<string>(
      'STORE_NAME',
      '[STORE_NAME not set]',
    );
    this.logger.warn(
      `[DEV ONLY - no real SMS sent] Welcome SMS to ${phone}: ${firstName} عزیز، به ${storeName} خوش آمدید.`,
    );
    return Promise.resolve();
  }
}
