import { DiscountCode, DiscountType } from './entities/discount-code.entity';

export interface PublicDiscountCode {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  startsAt: Date | null;
  expiresAt: Date | null;
  minimumOrderAmount: number | null;
  isPersonal: boolean;
}

// usageLimit/usagePerUser are deliberately omitted here -- they aren't
// enforced anywhere yet (no redemption tracking exists), so surfacing them
// to the client would imply functionality that doesn't exist.
export function toPublicDiscountCode(coupon: DiscountCode): PublicDiscountCode {
  return {
    id: coupon.id,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    startsAt: coupon.startsAt,
    expiresAt: coupon.expiresAt,
    minimumOrderAmount: coupon.minimumOrderAmount,
    isPersonal: coupon.userId !== null,
  };
}
