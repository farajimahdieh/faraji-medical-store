import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { CatalogModule } from './catalog/catalog.module';
import { StorageModule } from './storage/storage.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { AddressesModule } from './addresses/addresses.module';
import { CouponsModule } from './coupons/coupons.module';
import { RecentlyViewedModule } from './recently-viewed/recently-viewed.module';
import { SearchHistoryModule } from './search-history/search-history.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { AiModule } from './ai/ai.module';
import { ContentModule } from './content/content.module';
import { typeOrmModuleOptions } from './database/typeorm-options';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRoot(typeOrmModuleOptions()),

    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }]),

    UsersModule,
    AuthModule,
    AdminModule,
    StorageModule,
    CatalogModule,
    WishlistModule,
    AddressesModule,
    CouponsModule,
    RecentlyViewedModule,
    SearchHistoryModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
    AiModule,
    ContentModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
