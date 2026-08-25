import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import { DiscountCode } from './entities/discount-code.entity';
import { PublicDiscountCode, toPublicDiscountCode } from './coupons.public';

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(DiscountCode)
    private readonly discountCodeRepo: Repository<DiscountCode>,
  ) {}

  async findAvailableForUser(userId: string): Promise<PublicDiscountCode[]> {
    const now = new Date();
    const codes = await this.discountCodeRepo.find({
      where: [
        { isActive: true, userId: IsNull() },
        { isActive: true, userId },
      ],
      order: { createdAt: 'DESC' },
    });

    return codes
      .filter((code) => this.isWithinWindow(code, now))
      .sort((a, b) => Number(b.userId !== null) - Number(a.userId !== null))
      .map(toPublicDiscountCode);
  }

  private isWithinWindow(coupon: DiscountCode, now: Date): boolean {
    if (coupon.startsAt && coupon.startsAt.getTime() > now.getTime()) {
      return false;
    }
    if (coupon.expiresAt && coupon.expiresAt.getTime() < now.getTime()) {
      return false;
    }
    return true;
  }
}
