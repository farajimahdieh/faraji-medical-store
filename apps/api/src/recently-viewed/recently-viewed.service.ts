import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RecentlyViewedProduct } from './entities/recently-viewed-product.entity';
import { Product, ProductStatus } from '../catalog/entities/product.entity';
import {
  PublicRecentlyViewedItem,
  toPublicRecentlyViewedItem,
} from './recently-viewed.public';

const MAX_STORED_PER_USER = 20;

@Injectable()
export class RecentlyViewedService {
  constructor(
    @InjectRepository(RecentlyViewedProduct)
    private readonly recentlyViewedRepo: Repository<RecentlyViewedProduct>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async recordView(userId: string, productId: string): Promise<void> {
    const product = await this.productRepo.findOne({
      where: { id: productId, status: ProductStatus.ACTIVE },
    });
    if (!product) {
      throw new NotFoundException('محصول یافت نشد');
    }

    const existing = await this.recentlyViewedRepo.findOne({
      where: { userId, productId },
    });
    if (existing) {
      existing.viewedAt = new Date();
      await this.recentlyViewedRepo.save(existing);
    } else {
      await this.recentlyViewedRepo.save(
        this.recentlyViewedRepo.create({
          userId,
          productId,
          viewedAt: new Date(),
        }),
      );
    }

    await this.trimToMax(userId);
  }

  async findRecentForUser(
    userId: string,
    limit: number,
  ): Promise<PublicRecentlyViewedItem[]> {
    const entries = await this.recentlyViewedRepo
      .createQueryBuilder('rv')
      .innerJoinAndSelect('rv.product', 'product')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.variants', 'variants')
      .where('rv.userId = :userId', { userId })
      .andWhere('product.status = :status', { status: ProductStatus.ACTIVE })
      .orderBy('rv.viewedAt', 'DESC')
      .take(limit)
      .getMany();

    return entries.map(toPublicRecentlyViewedItem);
  }

  async clearForUser(userId: string): Promise<void> {
    await this.recentlyViewedRepo.delete({ userId });
  }

  // Keeps only the most-recently-viewed MAX_STORED_PER_USER rows -- cheap
  // since the list is capped small and this only runs after a write.
  private async trimToMax(userId: string): Promise<void> {
    const excess = await this.recentlyViewedRepo
      .createQueryBuilder('rv')
      .select('rv.id', 'id')
      .where('rv.userId = :userId', { userId })
      .orderBy('rv.viewedAt', 'DESC')
      .skip(MAX_STORED_PER_USER)
      .getRawMany<{ id: string }>();

    if (excess.length > 0) {
      await this.recentlyViewedRepo.delete(excess.map((row) => row.id));
    }
  }
}
