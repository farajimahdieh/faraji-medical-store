import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import { WishlistItem } from './entities/wishlist-item.entity';
import { Product, ProductStatus } from '../catalog/entities/product.entity';
import { ProductVariant } from '../catalog/entities/product-variant.entity';
import { AddWishlistItemDto } from './dto/add-wishlist-item.dto';
import {
  PublicWishlistItem,
  PublicWishlistListResponse,
  toPublicWishlistItem,
} from './wishlist.public';

// Postgres error code for a unique-constraint violation.
const UNIQUE_VIOLATION = '23505';

const ITEM_RELATIONS = {
  product: { images: true, brand: true, variants: true },
  variant: true,
} as const;

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(WishlistItem)
    private readonly wishlistRepo: Repository<WishlistItem>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,
  ) {}

  async add(
    userId: string,
    dto: AddWishlistItemDto,
  ): Promise<PublicWishlistItem> {
    const variantId = dto.variantId ?? null;
    await this.assertProductAndVariant(dto.productId, variantId);

    const existing = await this.findOwnItem(userId, dto.productId, variantId);
    if (existing) {
      return toPublicWishlistItem(existing);
    }

    const item = this.wishlistRepo.create({
      userId,
      productId: dto.productId,
      variantId,
    });

    try {
      await this.wishlistRepo.save(item);
    } catch (error: unknown) {
      // Two near-simultaneous "add" requests can both pass the findOne check
      // above before either has committed. The partial unique indexes on
      // wishlist_items are the real guard here — on a race, just return
      // whichever row actually won.
      if (this.isUniqueViolation(error)) {
        const raced = await this.findOwnItem(userId, dto.productId, variantId);
        if (raced) return toPublicWishlistItem(raced);
      }
      throw error;
    }

    const saved = await this.wishlistRepo.findOne({
      where: { id: item.id },
      relations: ITEM_RELATIONS,
    });
    return toPublicWishlistItem(saved!);
  }

  async findAllForUser(
    userId: string,
    page: number,
    limit: number,
  ): Promise<PublicWishlistListResponse> {
    const [items, total] = await this.wishlistRepo.findAndCount({
      where: { userId },
      relations: ITEM_RELATIONS,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: items.map(toPublicWishlistItem),
      total,
      page,
      limit,
    };
  }

  async countForUser(userId: string): Promise<{ count: number }> {
    const count = await this.wishlistRepo.count({ where: { userId } });
    return { count };
  }

  async isInWishlist(
    userId: string,
    productId: string,
    variantId: string | null,
  ): Promise<{ inWishlist: boolean; wishlistItemId: string | null }> {
    const item = await this.wishlistRepo.findOne({
      where: {
        userId,
        productId,
        variantId: variantId ?? IsNull(),
      },
    });
    return { inWishlist: item !== null, wishlistItemId: item?.id ?? null };
  }

  async updateNote(
    userId: string,
    id: string,
    note: string | null,
  ): Promise<PublicWishlistItem> {
    const item = await this.wishlistRepo.findOne({ where: { id, userId } });
    if (!item) {
      throw new NotFoundException('یادداشت مورد نظر یافت نشد');
    }

    item.note = note && note.length > 0 ? note : null;
    await this.wishlistRepo.save(item);

    const saved = await this.wishlistRepo.findOne({
      where: { id },
      relations: ITEM_RELATIONS,
    });
    return toPublicWishlistItem(saved!);
  }

  async remove(userId: string, id: string): Promise<void> {
    const result = await this.wishlistRepo.delete({ id, userId });
    if (result.affected === 0) {
      throw new NotFoundException('این مورد در علاقه‌مندی‌های شما یافت نشد');
    }
  }

  private findOwnItem(
    userId: string,
    productId: string,
    variantId: string | null,
  ): Promise<WishlistItem | null> {
    return this.wishlistRepo.findOne({
      where: {
        userId,
        productId,
        variantId: variantId ?? IsNull(),
      },
      relations: ITEM_RELATIONS,
    });
  }

  private async assertProductAndVariant(
    productId: string,
    variantId: string | null,
  ): Promise<void> {
    const product = await this.productRepo.findOne({
      where: { id: productId, status: ProductStatus.ACTIVE },
    });
    if (!product) {
      throw new NotFoundException('محصول یافت نشد');
    }

    if (variantId) {
      const variant = await this.variantRepo.findOne({
        where: { id: variantId, productId },
      });
      if (!variant) {
        throw new BadRequestException('این سایز متعلق به این محصول نیست');
      }
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === UNIQUE_VIOLATION
    );
  }
}
