import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager, In } from 'typeorm';

import { Category } from '../../entities/category.entity';
import { Product, ProductStatus } from '../../entities/product.entity';
import { ProductVariant } from '../../entities/product-variant.entity';
import { ProductSource } from '../../entities/product-source.entity';
import { HolooGroup, HolooItem } from './holoo-sheet';

const SOURCE_NAME = 'holoo';
// Variant size for items Holoo lists in a single size only.
const DEFAULT_SIZE = 'استاندارد';

export interface HolooImportSummary {
  createdProducts: number;
  createdVariants: number;
  updatedVariants: number;
}

// Writes parsed Holoo rows into the catalog. Holoo owns price/stock/code
// (see ProductVariant); everything else -- description, images, status --
// belongs to the site, so an existing product is never touched beyond its
// variants. New products start INCOMPLETE (no images/description yet) and
// show up in the admin "pending" list.
@Injectable()
export class HolooImportService {
  constructor(private readonly dataSource: DataSource) {}

  async run(
    groups: HolooGroup[],
    categorySlug: string,
  ): Promise<HolooImportSummary> {
    const summary: HolooImportSummary = {
      createdProducts: 0,
      createdVariants: 0,
      updatedVariants: 0,
    };

    await this.dataSource.transaction(async (manager) => {
      const category = await manager.findOneBy(Category, {
        slug: categorySlug,
      });
      if (!category) {
        throw new NotFoundException(`Category "${categorySlug}" not found`);
      }

      for (const group of groups) {
        const productId = await this.resolveProduct(
          manager,
          group,
          category,
          summary,
        );
        for (const item of group.items) {
          await this.upsertVariant(manager, productId, item, summary);
        }
      }
    });

    return summary;
  }

  private async resolveProduct(
    manager: EntityManager,
    group: HolooGroup,
    category: Category,
    summary: HolooImportSummary,
  ): Promise<string> {
    const codes = group.items.map((item) => item.code);
    const known = await manager.findOne(ProductVariant, {
      where: { accountingId: In(codes) },
    });
    if (known) return known.productId;

    const source = await manager.findOneBy(ProductSource, {
      sourceName: SOURCE_NAME,
      externalProductCode: In(codes),
    });
    if (source) return source.productId;

    const product = await manager.save(
      manager.create(Product, {
        name: group.name,
        slug: await this.uniqueSlug(manager, group.name),
        categoryId: category.id,
        status: ProductStatus.INCOMPLETE,
      }),
    );
    await manager.save(
      manager.create(ProductSource, {
        productId: product.id,
        sourceName: SOURCE_NAME,
        // A real Holoo code, so the product page's "کد محصول" is one staff
        // can look up in Holoo.
        externalProductCode: group.items[0].code,
        lastImportedAt: new Date(),
      }),
    );
    summary.createdProducts += 1;
    return product.id;
  }

  private async upsertVariant(
    manager: EntityManager,
    productId: string,
    item: HolooItem,
    summary: HolooImportSummary,
  ): Promise<void> {
    const size = item.size ?? DEFAULT_SIZE;
    // Matched by Holoo code first; otherwise adopt an unlinked variant of
    // the same size (e.g. one created by hand before the import existed).
    const variant =
      (await manager.findOneBy(ProductVariant, { accountingId: item.code })) ??
      (await manager.findOneBy(ProductVariant, { productId, size }));

    const synced = {
      accountingId: item.code,
      accountingName: item.name,
      price: item.priceToman,
      stock: item.stock,
      lastSyncedAt: new Date(),
    };

    if (variant) {
      Object.assign(variant, synced);
      await manager.save(variant);
      summary.updatedVariants += 1;
      return;
    }

    await manager.save(
      manager.create(ProductVariant, { productId, size, ...synced }),
    );
    summary.createdVariants += 1;
  }

  // Same Persian-friendly slug shape as AdminProductsService.slugify.
  private async uniqueSlug(
    manager: EntityManager,
    name: string,
  ): Promise<string> {
    const base =
      name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9؀-ۿ]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'product';
    let candidate = base;
    for (
      let n = 2;
      await manager.existsBy(Product, { slug: candidate });
      n += 1
    ) {
      candidate = `${base}-${n}`;
    }
    return candidate;
  }
}
