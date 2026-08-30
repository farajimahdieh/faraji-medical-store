import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  DiscountCode,
  CouponAudienceType,
} from './entities/discount-code.entity';
import { CouponAudienceMember } from './entities/coupon-audience-member.entity';
import { Order } from '../orders/entities/order.entity';

const NOT_ELIGIBLE_MESSAGE = 'شما واجد شرایط استفاده از این کد تخفیف نیستید';

// Eligibility only, evaluated per-user at apply/redeem time -- no
// precomputed segments, no rule engine. Counts/sums treat every placed
// order the same regardless of status (simplest interpretation; revisit
// only if a "completed orders only" definition is actually needed).
@Injectable()
export class CouponAudienceService {
  constructor(
    @InjectRepository(CouponAudienceMember)
    private readonly audienceMemberRepo: Repository<CouponAudienceMember>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {}

  async assertEligible(coupon: DiscountCode, userId: string): Promise<void> {
    switch (coupon.audienceType) {
      case CouponAudienceType.ALL:
        return;

      case CouponAudienceType.SPECIFIC_USERS: {
        const memberCount = await this.audienceMemberRepo.count({
          where: { discountCodeId: coupon.id, userId },
        });
        if (memberCount === 0)
          throw new BadRequestException(NOT_ELIGIBLE_MESSAGE);
        return;
      }

      case CouponAudienceType.NO_ORDERS_EVER: {
        const orderCount = await this.orderRepo.count({ where: { userId } });
        if (orderCount > 0) throw new BadRequestException(NOT_ELIGIBLE_MESSAGE);
        return;
      }

      case CouponAudienceType.NO_ORDERS_IN_MONTHS: {
        const since = new Date();
        since.setMonth(since.getMonth() - (coupon.audienceMonths ?? 0));
        const recentCount = await this.orderRepo
          .createQueryBuilder('order')
          .where('order.userId = :userId', { userId })
          .andWhere('order.createdAt >= :since', { since })
          .getCount();
        if (recentCount > 0)
          throw new BadRequestException(NOT_ELIGIBLE_MESSAGE);
        return;
      }

      case CouponAudienceType.MIN_ORDERS: {
        const orderCount = await this.orderRepo.count({ where: { userId } });
        if (orderCount < (coupon.audienceMinOrders ?? 0)) {
          throw new BadRequestException(NOT_ELIGIBLE_MESSAGE);
        }
        return;
      }

      case CouponAudienceType.MIN_SPEND: {
        const row = await this.orderRepo
          .createQueryBuilder('order')
          .select('COALESCE(SUM(order.totalAmount), 0)', 'total')
          .where('order.userId = :userId', { userId })
          .getRawOne<{ total: string }>();
        if (Number(row?.total ?? 0) < (coupon.audienceMinSpend ?? 0)) {
          throw new BadRequestException(NOT_ELIGIBLE_MESSAGE);
        }
        return;
      }
    }
  }
}
