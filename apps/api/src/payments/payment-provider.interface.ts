export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');

export interface PaymentChargeResult {
  status: 'succeeded' | 'failed';
}

// Kept deliberately thin (one method) so a real gateway (Zarinpal/IDPay/
// NextPay -- see docs/project-blueprint.md #13/#14) can implement this
// later as a drop-in replacement for MockPaymentProvider, without
// OrdersService ever changing.
export interface PaymentProvider {
  charge(orderId: string, amount: number): Promise<PaymentChargeResult>;
}
