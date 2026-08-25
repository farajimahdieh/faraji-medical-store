import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { AddressesModule } from './addresses/addresses.module';
import { CouponsModule } from './coupons/coupons.module';
import { RecentlyViewedModule } from './recently-viewed/recently-viewed.module';
import { SearchHistoryModule } from './search-history/search-history.module';
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
    CatalogModule,
    WishlistModule,
    AddressesModule,
    CouponsModule,
    RecentlyViewedModule,
    SearchHistoryModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
