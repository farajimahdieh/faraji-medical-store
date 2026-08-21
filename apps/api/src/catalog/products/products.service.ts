import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Product, ProductStatus } from '../entities/product.entity';
import { ProductSource } from '../entities/product-source.entity';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import {
  PublicProductDetail,
  PublicProductListItem,
  toPublicProductDetail,
  toPublicProductListItem,
} from './product.public';

export interface PublicProductListResponse {
  items: PublicProductListItem[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductSource)
    private readonly sourceRepo: Repository<ProductSource>,
  ) {}

  async list(query: ListProductsQueryDto): Promise<PublicProductListResponse> {
    const { page, limit, category } = query;

    // Paginating a query that joins to-many relations (images/variants)
    // would fan out and break LIMIT/OFFSET, so page over product ids first
    // (joining only what filtering needs), then load full relations for
    // just that page.
    const total = await this.buildFilteredQuery(category).getCount();

    const idRows = await this.buildFilteredQuery(category)
      .select('product.id', 'id')
      .orderBy('product.createdAt', 'DESC')
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany<{ id: string }>();

    const ids = idRows.map((row) => row.id);
    if (ids.length === 0) {
      return { items: [], total, page, limit };
    }

    const products = await this.productRepo.find({
      where: { id: In(ids) },
      relations: { brand: true, images: true, variants: true },
    });

    const byId = new Map(products.map((product) => [product.id, product]));
    const ordered = ids
      .map((id) => byId.get(id))
      .filter((product): product is Product => product !== undefined);

    return {
      items: ordered.map(toPublicProductListItem),
      total,
      page,
      limit,
    };
  }

  async getBySlug(slug: string): Promise<PublicProductDetail> {
    const product = await this.productRepo.findOne({
      where: { slug, status: ProductStatus.ACTIVE },
      relations: {
        brand: true,
        category: true,
        images: true,
        variants: true,
        features: true,
      },
    });
    if (!product) {
      throw new NotFoundException('محصول یافت نشد');
    }

    const source = await this.sourceRepo.findOne({
      where: { productId: product.id },
      order: { createdAt: 'ASC' },
    });

    return toPublicProductDetail(product, source?.externalProductCode ?? null);
  }

  private buildFilteredQuery(categorySlug?: string) {
    const qb = this.productRepo
      .createQueryBuilder('product')
      .leftJoin('product.category', 'category')
      .where('product.status = :status', { status: ProductStatus.ACTIVE });

    if (categorySlug) {
      qb.andWhere('category.slug = :categorySlug', { categorySlug });
    }

    return qb;
  }
}
