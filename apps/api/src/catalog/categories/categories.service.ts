import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Category } from '../entities/category.entity';
import { PublicCategory, toPublicCategory } from './category.public';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async getBySlug(slug: string): Promise<PublicCategory> {
    const category = await this.categoryRepo.findOne({
      where: { slug, isActive: true },
      relations: { parent: true },
    });
    if (!category) {
      throw new NotFoundException('دسته‌بندی یافت نشد');
    }
    return toPublicCategory(category);
  }

  // Product filtering treats a category as "itself plus its direct
  // children" (e.g. filtering by the "ارتوپدی..." root also matches its
  // "زانوبند"/"کمربند طبی"/... subcategories) — the schema is only ever two
  // levels deep, so this doesn't need to recurse further.
  async resolveFilterCategoryIds(slug: string): Promise<string[]> {
    const category = await this.categoryRepo.findOneBy({
      slug,
      isActive: true,
    });
    if (!category) return [];

    const children = await this.categoryRepo.find({
      where: { parentId: category.id, isActive: true },
    });
    return [category.id, ...children.map((child) => child.id)];
  }
}
