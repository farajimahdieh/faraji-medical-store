import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Brand } from '../entities/brand.entity';
import { Category } from '../entities/category.entity';
import { Product } from '../entities/product.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import { ProductImage } from '../entities/product-image.entity';
import { ProductSpecification } from '../entities/product-specification.entity';
import { ProductFeature } from '../entities/product-feature.entity';
import { SizeGuide } from '../entities/size-guide.entity';
import { ProductSource } from '../entities/product-source.entity';
import { ProductFaq } from '../entities/product-faq.entity';
import { StorageModule } from '../../storage/storage.module';
import { typeOrmModuleOptions } from '../../database/typeorm-options';
import { ContentApplyService } from './content-apply.service';

// Standalone bootstrap module for the `content:apply` CLI script: database,
// catalog entities and storage (local disk or Arvan, per STORAGE_DRIVER).
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(typeOrmModuleOptions()),
    TypeOrmModule.forFeature([
      Brand,
      Category,
      Product,
      ProductVariant,
      ProductImage,
      ProductSpecification,
      ProductFeature,
      SizeGuide,
      ProductSource,
      ProductFaq,
    ]),
    StorageModule,
  ],
  providers: [ContentApplyService],
})
export class ContentApplyModule {}
