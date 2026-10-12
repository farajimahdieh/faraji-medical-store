import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { ProductVariant } from '../catalog/entities/product-variant.entity';
import { UserAddress } from '../addresses/entities/user-address.entity';
import { User } from '../users/entities/user.entity';
import { DiscountCode } from '../coupons/entities/discount-code.entity';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { AdminOrdersController } from './admin-orders.controller';
import { AdminOrdersService } from './admin-orders.service';
import { AuthModule } from '../auth/auth.module';
import { CartModule } from '../cart/cart.module';
import { CouponsModule } from '../coupons/coupons.module';
import { AdminModule } from '../admin/admin.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      ProductVariant,
      UserAddress,
      DiscountCode,
      User,
    ]),
    AuthModule,
    CartModule,
    CouponsModule,
    AdminModule,
    StorageModule,
  ],
  controllers: [OrdersController, AdminOrdersController],
  providers: [OrdersService, AdminOrdersService],
})
export class OrdersModule {}
