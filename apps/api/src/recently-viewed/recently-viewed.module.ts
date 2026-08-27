import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RecentlyViewedProduct } from './entities/recently-viewed-product.entity';
import { Product } from '../catalog/entities/product.entity';
import { RecentlyViewedController } from './recently-viewed.controller';
import { RecentlyViewedService } from './recently-viewed.service';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RecentlyViewedProduct, Product]),
    AuthModule,
    StorageModule,
  ],
  controllers: [RecentlyViewedController],
  providers: [RecentlyViewedService],
})
export class RecentlyViewedModule {}
