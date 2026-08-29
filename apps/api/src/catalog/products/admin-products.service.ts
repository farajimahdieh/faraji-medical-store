import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Product, ProductStatus } from '../entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AdminListProductsQueryDto } from './dto/admin-list-products-query.dto';

const ADMIN_DETAIL_RELATIONS = {
  brand: true,
  category: true,
  images: true,
} as const;

// The "hasn't been decided on yet" states -- a newly created product starts
// in DRAFT and lands here automatically, no separate submit step needed.
const PENDING_REVIEW_STATUSES = [
  ProductStatus.DRAFT,
  ProductStatus.INCOMPLETE,
  ProductStatus.NEEDS_REVIEW,
];

// Admin-facing CRUD for products/variants. Separate from ProductsService
// (which only ever serves published products to shoppers) so neither file
// has to reason about the other's access rules.
@Injectable()
export class AdminProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async list(query: AdminListProductsQueryDto) {
    const { page, limit } = query;
    const qb = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.images', 'images')
      .orderBy('product.createdAt', 'DESC');

    if (query.status) {
      qb.andWhere('product.status = :status', { status: query.status });
    }
    if (query.q) {
      qb.andWhere('(product.name ILIKE :q OR product.slug ILIKE :q)', {
        q: `%${query.q}%`,
      });
    }

    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total, page, limit };
  }

  async listPending(): Promise<Product[]> {
    return this.productRepo.find({
      where: { status: In(PENDING_REVIEW_STATUSES) },
      relations: { brand: true, images: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getById(id: string): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ADMIN_DETAIL_RELATIONS,
    });
    if (!product) {
      throw new NotFoundException('محصول یافت نشد');
    }
    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const name = dto.name.trim();
    const existing = await this.productRepo.findOneBy({ name });
    if (existing) {
      throw new ConflictException('محصولی با این نام قبلاً ثبت شده است');
    }

    const slug = await this.uniqueSlug(dto.slug ?? this.slugify(name));

    const product = await this.productRepo.save(
      this.productRepo.create({
        name,
        slug,
        brandId: dto.brandId ?? null,
        categoryId: dto.categoryId ?? null,
        shortDescription: dto.shortDescription ?? null,
        description: dto.description ?? null,
        status: ProductStatus.DRAFT,
      }),
    );
    return this.getById(product.id);
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.getById(id);

    if (dto.name !== undefined) product.name = dto.name;
    if (dto.brandId !== undefined) product.brandId = dto.brandId;
    if (dto.categoryId !== undefined) product.categoryId = dto.categoryId;
    if (dto.shortDescription !== undefined)
      product.shortDescription = dto.shortDescription;
    if (dto.description !== undefined) {
      product.description = dto.description;
      product.descriptionLocked = true; // keep the importer from overwriting a manual edit
    }
    if (dto.isFeatured !== undefined) product.isFeatured = dto.isFeatured;

    await this.productRepo.save(product);
    return this.getById(id);
  }

  async approve(id: string): Promise<Product> {
    const product = await this.getById(id);
    product.status = ProductStatus.ACTIVE;
    product.rejectionReason = null;
    await this.productRepo.save(product);
    return this.getById(id);
  }

  async reject(id: string, reason: string): Promise<Product> {
    const product = await this.getById(id);
    // Sent back to draft (not published) so it naturally stays in the
    // pending-review queue until the admin fixes it and it's re-reviewed.
    product.status = ProductStatus.DRAFT;
    product.rejectionReason = reason;
    await this.productRepo.save(product);
    return this.getById(id);
  }

  private async uniqueSlug(candidate: string): Promise<string> {
    const existing = await this.productRepo.findOneBy({ slug: candidate });
    if (!existing) return candidate;
    return `${candidate}-${Date.now()}`;
  }

  private slugify(name: string): string {
    const base = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9؀-ۿ]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return base || `product-${Date.now()}`;
  }
}
