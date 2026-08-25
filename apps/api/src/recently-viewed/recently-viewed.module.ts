import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RecentlyViewedProduct } from './entities/recently-viewed-product.entity';
import { Product } from '../catalog/entities/product.entity';
import { RecentlyViewedController } from './recently-viewed.controller';
import { RecentlyViewedService } from './recently-viewed.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RecentlyViewedProduct, Product]),
    AuthModule,
  ],
  controllers: [RecentlyViewedController],
  providers: [RecentlyViewedService],
})
export class RecentlyViewedModule {}
