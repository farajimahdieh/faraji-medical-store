import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DiscountCode } from './entities/discount-code.entity';
import { CouponRedemption } from './entities/coupon-redemption.entity';
import { CouponAudienceMember } from './entities/coupon-audience-member.entity';
import { Order } from '../orders/entities/order.entity';
import { CouponsController } from './coupons.controller';
import { CouponsService } from './coupons.service';
import { CouponValidationService } from './coupon-validation.service';
import { CouponAudienceService } from './coupon-audience.service';
import { AdminCouponsController } from './admin-coupons.controller';
import { AdminCouponsService } from './admin-coupons.service';
import { AuthModule } from '../auth/auth.module';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DiscountCode,
      CouponRedemption,
      CouponAudienceMember,
      Order,
    ]),
    AuthModule,
    AdminModule,
  ],
  controllers: [CouponsController, AdminCouponsController],
  providers: [
    CouponsService,
    CouponValidationService,
    CouponAudienceService,
    AdminCouponsService,
  ],
  exports: [CouponValidationService],
})
export class CouponsModule {}
