import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository, SelectQueryBuilder } from 'typeorm';

import { Product, ProductStatus } from '../entities/product.entity';
import { ProductSource } from '../entities/product-source.entity';
import { CategoriesService } from '../categories/categories.service';
import {
  ListProductsQueryDto,
  ProductSortOption,
} from './dto/list-products-query.dto';
import { ListProductFacetsQueryDto } from './dto/list-product-facets-query.dto';
import { compareSizes } from './size-order';
import {
  normalizedSqlColumn,
  normalizeSearchQuery,
} from '../../common/persian-search.util';
import {
  PublicFacetOption,
  PublicProductDetail,
  PublicProductFacets,
  PublicProductListItem,
  PublicSizeFacetOption,
  toPublicProductDetail,
  toPublicProductListItem,
} from './product.public';

export interface PublicProductListResponse {
  items: PublicProductListItem[];
  total: number;
  page: number;
  limit: number;
}

interface ScopeFilters {
  category?: string;
  q?: string;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductSource)
    private readonly sourceRepo: Repository<ProductSource>,
    private readonly categoriesService: CategoriesService,
  ) {}

  async list(query: ListProductsQueryDto): Promise<PublicProductListResponse> {
    const { page, limit } = query;

    // Paginating a query that joins to-many relations (images/variants)
    // would fan out and break LIMIT/OFFSET, so page over product ids first
    // (joining only what filtering needs, via EXISTS rather than JOIN so
    // nothing fans out), then load full relations for just that page.
    const total = await (await this.buildFilteredQuery(query)).getCount();

    const idRows = await (
      await this.buildFilteredQuery(query)
    )
      .select('product.id', 'id')
      .orderBy(...this.orderByFor(query.sort))
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

  async getFacets(
    query: ListProductFacetsQueryDto,
  ): Promise<PublicProductFacets> {
    const scope: ScopeFilters = { category: query.category, q: query.q };

    const [subcategoryRows, brandRows, sizeRows, variantAvailability] =
      await Promise.all([
        (await this.buildScopedQuery(scope))
          .innerJoin('product.category', 'facetCategory')
          .select('facetCategory.id', 'id')
          .addSelect('facetCategory.name', 'name')
          .addSelect('facetCategory.slug', 'slug')
          .addSelect('COUNT(product.id)', 'count')
          .groupBy('facetCategory.id')
          .addGroupBy('facetCategory.name')
          .addGroupBy('facetCategory.slug')
          .orderBy('facetCategory.name', 'ASC')
          .getRawMany<{
            id: string;
            name: string;
            slug: string;
            count: string;
          }>(),

        (await this.buildScopedQuery(scope))
          .innerJoin('product.brand', 'facetBrand')
          .select('facetBrand.id', 'id')
          .addSelect('facetBrand.name', 'name')
          .addSelect('facetBrand.slug', 'slug')
          .addSelect('COUNT(product.id)', 'count')
          .groupBy('facetBrand.id')
          .addGroupBy('facetBrand.name')
          .addGroupBy('facetBrand.slug')
          .orderBy('facetBrand.name', 'ASC')
          .getRawMany<{
            id: string;
            name: string;
            slug: string;
            count: string;
          }>(),

        (await this.buildScopedQuery(scope))
          .innerJoin('product.variants', 'facetVariant')
          .select('facetVariant.size', 'size')
          .addSelect('COUNT(DISTINCT product.id)', 'count')
          .groupBy('facetVariant.size')
          .getRawMany<{ size: string; count: string }>(),

        (await this.buildScopedQuery(scope))
          .innerJoin('product.variants', 'availabilityVariant')
          .select('BOOL_OR(availabilityVariant.price IS NOT NULL)', 'hasPrice')
          .addSelect(
            'BOOL_OR(availabilityVariant.stock IS NOT NULL)',
            'hasStock',
          )
          .getRawOne<{ hasPrice: boolean | null; hasStock: boolean | null }>(),
      ]);

    const subcategories: PublicFacetOption[] = subcategoryRows.map((row) => ({
      name: row.name,
      slug: row.slug,
      count: Number(row.count),
    }));

    const brands: PublicFacetOption[] = brandRows.map((row) => ({
      name: row.name,
      slug: row.slug,
      count: Number(row.count),
    }));

    const sizes: PublicSizeFacetOption[] = sizeRows
      .map((row) => ({ size: row.size, count: Number(row.count) }))
      .sort((a, b) => compareSizes(a.size, b.size));

    return {
      subcategories,
      brands,
      sizes,
      priceFilterAvailable: variantAvailability?.hasPrice === true,
      stockFilterAvailable: variantAvailability?.hasStock === true,
    };
  }

  async getBySlug(slug: string): Promise<PublicProductDetail> {
    const product = await this.productRepo.findOne({
      where: { slug, status: ProductStatus.ACTIVE },
      relations: {
        brand: true,
        category: { parent: true },
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

  private orderByFor(sort: ProductSortOption): [string, 'ASC' | 'DESC'] {
    return sort === ProductSortOption.NAME_ASC
      ? ['product.name', 'ASC']
      : ['product.createdAt', 'DESC'];
  }

  // Category + search scope shared by the product list and the facet
  // endpoint — facets deliberately don't also narrow by brand/size (see
  // ListProductFacetsQueryDto), so both build off this common base instead
  // of the fuller list() filter set.
  private async buildScopedQuery(
    scope: ScopeFilters,
  ): Promise<SelectQueryBuilder<Product>> {
    const qb = this.productRepo
      .createQueryBuilder('product')
      .where('product.status = :status', { status: ProductStatus.ACTIVE });

    if (scope.category) {
      const categoryIds = await this.categoriesService.resolveFilterCategoryIds(
        scope.category,
      );
      qb.andWhere('product.categoryId IN (:...categoryIds)', {
        categoryIds: categoryIds.length > 0 ? categoryIds : [null],
      });
    }

    if (scope.q) {
      this.applySearch(qb, scope.q);
    }

    return qb;
  }

  private async buildFilteredQuery(
    query: ListProductsQueryDto,
  ): Promise<SelectQueryBuilder<Product>> {
    const qb = await this.buildScopedQuery({
      category: query.category,
      q: query.q,
    });

    if (query.brand) {
      qb.andWhere(
        `EXISTS (SELECT 1 FROM brands b WHERE b.id = product."brandId" AND b.slug = :brandSlug)`,
        { brandSlug: query.brand },
      );
    }

    if (query.size) {
      qb.andWhere(
        `EXISTS (SELECT 1 FROM product_variants pv WHERE pv."productId" = product.id AND pv.size = :size AND pv."isActive" = true)`,
        { size: query.size },
      );
    }

    if (query.inStock === 'true') {
      qb.andWhere(
        `EXISTS (SELECT 1 FROM product_variants pv2 WHERE pv2."productId" = product.id AND pv2.stock > 0)`,
      );
    }

    if (query.minPrice !== undefined) {
      qb.andWhere(
        `EXISTS (SELECT 1 FROM product_variants pv3 WHERE pv3."productId" = product.id AND pv3.price >= :minPrice)`,
        { minPrice: query.minPrice },
      );
    }

    if (query.maxPrice !== undefined) {
      qb.andWhere(
        `EXISTS (SELECT 1 FROM product_variants pv4 WHERE pv4."productId" = product.id AND pv4.price <= :maxPrice)`,
        { maxPrice: query.maxPrice },
      );
    }

    return qb;
  }

  // Matches product name, brand name, category (and its parent category)
  // name, or source product code — each side normalized the same way (see
  // persian-search.util.ts) so Yeh/Kaf variants and half-spaces in the
  // shopper's query don't cause a real match to be missed. Uses EXISTS/joins
  // that can't fan out a product into duplicate rows, so no DISTINCT is
  // needed for correct pagination.
  private applySearch(qb: SelectQueryBuilder<Product>, rawQuery: string): void {
    const normalized = normalizeSearchQuery(rawQuery);
    if (!normalized) return;

    qb.leftJoin('product.brand', 'brand');
    qb.leftJoin('product.category', 'category');
    qb.leftJoin('category.parent', 'rootCategory');

    const term = `%${normalized}%`;
    qb.andWhere(
      new Brackets((sub) => {
        sub
          .where(`${normalizedSqlColumn('product.name')} ILIKE :term`, { term })
          .orWhere(`${normalizedSqlColumn('brand.name')} ILIKE :term`, { term })
          .orWhere(`${normalizedSqlColumn('category.name')} ILIKE :term`, {
            term,
          })
          .orWhere(`${normalizedSqlColumn('rootCategory.name')} ILIKE :term`, {
            term,
          })
          .orWhere(
            `EXISTS (SELECT 1 FROM product_sources src WHERE src."productId" = product.id AND ${normalizedSqlColumn('src."externalProductCode"')} ILIKE :term)`,
            { term },
          );
      }),
    );
  }
}
