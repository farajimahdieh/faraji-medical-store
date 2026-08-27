import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DiscountCode } from './entities/discount-code.entity';
import { CouponRedemption } from './entities/coupon-redemption.entity';
import { CouponsController } from './coupons.controller';
import { CouponsService } from './coupons.service';
import { CouponValidationService } from './coupon-validation.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DiscountCode, CouponRedemption]),
    AuthModule,
  ],
  controllers: [CouponsController],
  providers: [CouponsService, CouponValidationService],
  exports: [CouponValidationService],
})
export class CouponsModule {}
