import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Brand } from '../../entities/brand.entity';
import { Category } from '../../entities/category.entity';
import { Product } from '../../entities/product.entity';
import { ProductVariant } from '../../entities/product-variant.entity';
import { ProductImage } from '../../entities/product-image.entity';
import { ProductSpecification } from '../../entities/product-specification.entity';
import { ProductFeature } from '../../entities/product-feature.entity';
import { SizeGuide } from '../../entities/size-guide.entity';
import { ProductSource } from '../../entities/product-source.entity';
import { typeOrmModuleOptions } from '../../../database/typeorm-options';
import { HolooImportService } from './holoo-import.service';

// Standalone bootstrap module for the `import:holoo` CLI script -- only a
// database connection and the catalog entities. Deliberately not
// CatalogModule: its controllers pull in auth/throttling a script has no
// use for.
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
    ]),
  ],
  providers: [HolooImportService],
})
export class HolooImportModule {}
