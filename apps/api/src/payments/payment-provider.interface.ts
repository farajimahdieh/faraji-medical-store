export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');

export interface PaymentChargeResult {
  status: 'succeeded' | 'failed';
}

// Not wired anywhere yet: orders are paid offline (cash on delivery / at
// the store, see PaymentMethod) until an online gateway is connected, which
// requires an eNamad. Iranian gateways (Zarinpal/IDPay/NextPay -- see
// docs/project-blueprint.md #13/#14) redirect the customer and verify on
// callback, so this synchronous shape will need a request/verify pair then.
// The old always-succeeding mock was removed so it can never mark a real
// order as paid.
export interface PaymentProvider {
  charge(orderId: string, amount: number): Promise<PaymentChargeResult>;
}
