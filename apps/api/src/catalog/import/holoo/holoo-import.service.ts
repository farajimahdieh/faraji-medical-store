import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager, In } from 'typeorm';

import { Category } from '../../entities/category.entity';
import { Product, ProductStatus } from '../../entities/product.entity';
import { ProductVariant } from '../../entities/product-variant.entity';
import { ProductSource } from '../../entities/product-source.entity';
import {
  HolooGroup,
  HolooItem,
  ItemOverride,
  overrideTarget,
} from './holoo-sheet';
import { MatchCandidate, matchProduct } from './product-match';

const SOURCE_NAME = 'holoo';
// Variant size for items Holoo lists in a single size only.
const DEFAULT_SIZE = 'استاندارد';

// Manual decisions for groups the matcher can't settle, keyed by any Holoo
// code in the group: an existing product's slug, "new" or "skip" (see
// ItemOverride for the object form).
export type MatchOverrides = Record<string, ItemOverride>;

export type PlanAction =
  | { kind: 'linked'; productId: string; productName: string } // codes already imported
  | {
      kind: 'matched';
      productId: string;
      productName: string;
      score: number | null;
    }
  | { kind: 'new' }
  | { kind: 'skip'; reason: string };

export interface PlanEntry {
  group: HolooGroup;
  action: PlanAction;
}

export interface HolooImportSummary {
  plan: PlanEntry[];
  createdProducts: number;
  createdVariants: number;
  updatedVariants: number;
  // Rows not written because their size on the target product is already
  // linked to a different Holoo code (two Holoo items for one variant).
  conflicts: string[];
}

// Writes parsed Holoo rows into the catalog. Holoo owns price/stock/code
// (see ProductVariant); everything else -- description, images, status --
// belongs to the site, so an existing product is never touched beyond its
// variants. Each group is resolved, in order, to: the product its Holoo
// codes are already linked to, a manual override, an existing product with
// the same name (e.g. imported earlier from teb-sanat.com), or a new
// product. Ambiguous name matches are skipped and reported -- never
// guessed. New products start INCOMPLETE.
@Injectable()
export class HolooImportService {
  constructor(private readonly dataSource: DataSource) {}

  async run(
    groups: HolooGroup[],
    categorySlug: string,
    {
      planOnly = false,
      overrides = {},
    }: { planOnly?: boolean; overrides?: MatchOverrides } = {},
  ): Promise<HolooImportSummary> {
    const summary: HolooImportSummary = {
      plan: [],
      createdProducts: 0,
      createdVariants: 0,
      updatedVariants: 0,
      conflicts: [],
    };

    await this.dataSource.transaction(async (manager) => {
      const category = await manager.findOneBy(Category, {
        slug: categorySlug,
      });
      if (!category) {
        throw new NotFoundException(`Category "${categorySlug}" not found`);
      }
      const candidates = await this.loadCandidates(manager, category.id);

      for (const group of groups) {
        const action = await this.plan(manager, group, candidates, overrides);
        summary.plan.push({ group, action });
        if (planOnly || action.kind === 'skip') continue;

        const productId =
          action.kind === 'new'
            ? await this.createProduct(manager, group, category, summary)
            : action.productId;
        for (const item of group.items) {
          await this.upsertVariant(manager, productId, item, summary);
        }
      }
    });

    return summary;
  }

  private async plan(
    manager: EntityManager,
    group: HolooGroup,
    candidates: MatchCandidate[],
    overrides: MatchOverrides,
  ): Promise<PlanAction> {
    const codes = group.items.map((item) => item.code);
    const known = await manager.findOne(ProductVariant, {
      where: { accountingId: In(codes) },
      relations: { product: true },
    });
    if (known) {
      return {
        kind: 'linked',
        productId: known.productId,
        productName: known.product.name,
      };
    }
    const source = await manager.findOne(ProductSource, {
      where: { sourceName: SOURCE_NAME, externalProductCode: In(codes) },
      relations: { product: true },
    });
    if (source) {
      return {
        kind: 'linked',
        productId: source.productId,
        productName: source.product.name,
      };
    }

    const override = codes
      .map((code) => overrideTarget(overrides[code]))
      .find(Boolean);
    if (override === 'new') return { kind: 'new' };
    if (override === 'skip')
      return { kind: 'skip', reason: 'skipped by override' };
    if (override) {
      const target = candidates.find(
        (candidate) => candidate.slug === override,
      );
      if (!target) {
        return {
          kind: 'skip',
          reason: `override slug "${override}" not found in this category`,
        };
      }
      return {
        kind: 'matched',
        productId: target.id,
        productName: target.name,
        score: null,
      };
    }

    const match = matchProduct(group.name, candidates);
    if (match.kind === 'match') {
      return {
        kind: 'matched',
        productId: match.candidate.id,
        productName: match.candidate.name,
        score: match.score,
      };
    }
    if (match.kind === 'ambiguous') {
      const options = match.options
        .map(
          (option) => `${option.candidate.slug} (${option.score.toFixed(2)})`,
        )
        .join('، ');
      return { kind: 'skip', reason: `ambiguous: ${options}` };
    }
    return { kind: 'new' };
  }

  // Products in the category and all its subcategories.
  private async loadCandidates(
    manager: EntityManager,
    rootId: string,
  ): Promise<MatchCandidate[]> {
    const categories = await manager.find(Category);
    const ids = new Set([rootId]);
    for (let grew = true; grew;) {
      grew = false;
      for (const category of categories) {
        if (
          category.parentId &&
          ids.has(category.parentId) &&
          !ids.has(category.id)
        ) {
          ids.add(category.id);
          grew = true;
        }
      }
    }
    const products = await manager.find(Product, {
      where: { categoryId: In([...ids]) },
      relations: { brand: true },
    });
    return products.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      brandSlug: product.brand?.slug ?? null,
    }));
  }

  private async createProduct(
    manager: EntityManager,
    group: HolooGroup,
    category: Category,
    summary: HolooImportSummary,
  ): Promise<string> {
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
    // the same size (e.g. one imported from teb-sanat.com before Holoo).
    let variant = await manager.findOneBy(ProductVariant, {
      accountingId: item.code,
    });
    if (!variant) {
      const sameSize = await manager.findOneBy(ProductVariant, {
        productId,
        size,
      });
      if (sameSize?.accountingId) {
        summary.conflicts.push(
          `«${item.name}» (${item.code}): size ${size} is already linked to Holoo code ${sameSize.accountingId}`,
        );
        return;
      }
      variant = sameSize;
    }

    // A size-less Holoo item on a product with exactly one unlinked variant
    // (typically "تک سایز") is that variant.
    if (!variant && item.size === null) {
      const unlinked = await manager.find(ProductVariant, {
        where: { productId },
      });
      const free = unlinked.filter(
        (candidate) => candidate.accountingId === null,
      );
      if (unlinked.length === 1 && free.length === 1) variant = free[0];
    }

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
