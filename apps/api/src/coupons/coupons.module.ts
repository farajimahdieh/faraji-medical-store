import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DiscountCode } from './entities/discount-code.entity';
import { CouponsController } from './coupons.controller';
import { CouponsService } from './coupons.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([DiscountCode]), AuthModule],
  controllers: [CouponsController],
  providers: [CouponsService],
})
export class CouponsModule {}
