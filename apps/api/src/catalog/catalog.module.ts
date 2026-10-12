import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Brand } from './entities/brand.entity';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductSpecification } from './entities/product-specification.entity';
import { ProductFeature } from './entities/product-feature.entity';
import { SizeGuide } from './entities/size-guide.entity';
import { ProductSource } from './entities/product-source.entity';
import { ProductFaq } from './entities/product-faq.entity';
import { ProductsController } from './products/products.controller';
import { ProductsService } from './products/products.service';
import { ProductSuggestionsService } from './products/product-suggestions.service';
import { AdminProductsController } from './products/admin-products.controller';
import { AdminProductsService } from './products/admin-products.service';
import { ProductImagesController } from './products/product-images.controller';
import { ProductImagesService } from './products/product-images.service';
import { CategoriesController } from './categories/categories.controller';
import { CategoriesService } from './categories/categories.service';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [
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
    AuthModule,
    StorageModule,
    AdminModule,
  ],
  controllers: [
    ProductsController,
    CategoriesController,
    AdminProductsController,
    ProductImagesController,
  ],
  providers: [
    ProductsService,
    ProductSuggestionsService,
    CategoriesService,
    AdminProductsService,
    ProductImagesService,
  ],
  exports: [TypeOrmModule, ProductsService],
})
export class CatalogModule {}
