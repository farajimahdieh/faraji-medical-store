import { Injectable } from '@nestjs/common';
import {
  PaymentChargeResult,
  PaymentProvider,
} from './payment-provider.interface';

// Development-only stand-in -- always succeeds immediately, no redirect/
// callback involved. Same role as MockSmsProvider for auth: lets the
// checkout flow run end-to-end before a real gateway is chosen.
@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  async charge(): Promise<PaymentChargeResult> {
    return { status: 'succeeded' };
  }
}
