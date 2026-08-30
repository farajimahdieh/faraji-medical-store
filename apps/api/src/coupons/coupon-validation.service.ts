import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository, type EntityManager } from 'typeorm';

import { DiscountCode, DiscountType } from './entities/discount-code.entity';
import { CouponRedemption } from './entities/coupon-redemption.entity';
import { CouponAudienceService } from './coupon-audience.service';
import { UserRole } from '../users/entities/user.entity';

export interface CouponValidationResult {
  coupon: DiscountCode;
  discountAmount: number;
}

// Shared by CartService (soft "apply to cart" / live re-check) and
// OrdersService (hard re-check + actual redemption at checkout) so the
// eligibility rules only live in one place. Redemption is only ever
// recorded via `redeem()`, at a successful checkout -- never at "apply to
// cart" time -- so an abandoned cart never burns a limited-use code.
@Injectable()
export class CouponValidationService {
  constructor(
    @InjectRepository(DiscountCode)
    private readonly discountCodeRepo: Repository<DiscountCode>,
    @InjectRepository(CouponRedemption)
    private readonly redemptionRepo: Repository<CouponRedemption>,
    private readonly couponAudience: CouponAudienceService,
  ) {}

  // `role` is only ever passed at the "apply to cart" entry point (see
  // CartService.applyCoupon) -- staff can never get a coupon into their
  // cart's appliedCouponId in the first place, so revalidate()/redeem()
  // (which only ever re-check an already-applied coupon) don't need it too.
  async previewByCode(
    code: string,
    userId: string,
    subtotal: number,
    role?: UserRole,
  ): Promise<CouponValidationResult> {
    const coupon = await this.discountCodeRepo.findOne({
      where: { code: ILike(code) },
    });
    return this.validate(coupon, userId, subtotal, this.redemptionRepo, role);
  }

  // Re-checks a coupon already known to be applied (e.g. while rendering the
  // cart) without a code lookup -- same rules as previewByCode.
  revalidate(
    coupon: DiscountCode,
    userId: string,
    subtotal: number,
  ): Promise<CouponValidationResult> {
    return this.validate(coupon, userId, subtotal, this.redemptionRepo);
  }

  // Re-validates against the transaction's own manager (so concurrent
  // checkouts see each other's just-inserted redemption rows) and records
  // the redemption in the same transaction.
  async redeem(
    couponId: string,
    userId: string,
    orderId: string,
    subtotal: number,
    manager: EntityManager,
  ): Promise<number> {
    const discountCodeRepo = manager.withRepository(this.discountCodeRepo);
    const redemptionRepo = manager.withRepository(this.redemptionRepo);

    const coupon = await discountCodeRepo.findOne({ where: { id: couponId } });
    const { discountAmount } = await this.validate(
      coupon,
      userId,
      subtotal,
      redemptionRepo,
    );

    await redemptionRepo.save(
      redemptionRepo.create({ discountCodeId: coupon!.id, userId, orderId }),
    );
    return discountAmount;
  }

  computeDiscount(coupon: DiscountCode, subtotal: number): number {
    if (coupon.type === DiscountType.PERCENTAGE) {
      const raw = Math.round((subtotal * coupon.value) / 100);
      return coupon.maxDiscountAmount !== null
        ? Math.min(raw, coupon.maxDiscountAmount)
        : raw;
    }
    return Math.min(coupon.value, subtotal);
  }

  private async validate(
    coupon: DiscountCode | null,
    userId: string,
    subtotal: number,
    redemptionRepo: Repository<CouponRedemption>,
    role?: UserRole,
  ): Promise<CouponValidationResult> {
    if (!coupon || !coupon.isActive) {
      throw new BadRequestException('کد تخفیف نامعتبر است');
    }
    if (role && role !== UserRole.CUSTOMER) {
      throw new BadRequestException('این کد تخفیف مخصوص مشتریان است');
    }

    const now = new Date();
    if (coupon.startsAt && coupon.startsAt.getTime() > now.getTime()) {
      throw new BadRequestException('این کد تخفیف هنوز فعال نشده است');
    }
    if (coupon.expiresAt && coupon.expiresAt.getTime() < now.getTime()) {
      throw new BadRequestException('این کد تخفیف منقضی شده است');
    }
    if (coupon.userId && coupon.userId !== userId) {
      throw new BadRequestException('این کد تخفیف مخصوص شما نیست');
    }
    await this.couponAudience.assertEligible(coupon, userId);
    if (coupon.minimumOrderAmount && subtotal < coupon.minimumOrderAmount) {
      throw new BadRequestException(
        `حداقل مبلغ سفارش برای این کد ${coupon.minimumOrderAmount.toLocaleString('fa-IR')} تومان است`,
      );
    }
    if (coupon.usageLimit !== null) {
      const totalUses = await redemptionRepo.count({
        where: { discountCodeId: coupon.id },
      });
      if (totalUses >= coupon.usageLimit) {
        throw new BadRequestException(
          'ظرفیت استفاده از این کد تخفیف تمام شده است',
        );
      }
    }
    if (coupon.usagePerUser !== null) {
      const userUses = await redemptionRepo.count({
        where: { discountCodeId: coupon.id, userId },
      });
      if (userUses >= coupon.usagePerUser) {
        throw new BadRequestException(
          'شما قبلاً از این کد تخفیف استفاده کرده‌اید',
        );
      }
    }

    return { coupon, discountAmount: this.computeDiscount(coupon, subtotal) };
  }
}
