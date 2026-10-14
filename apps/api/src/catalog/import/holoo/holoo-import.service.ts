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
import { pickMergeTarget } from './merge-target';
import { MatchCandidate, matchProduct } from './product-match';

const SOURCE_NAME = 'holoo';
// Variant size for items Holoo lists in a single size only.
const DEFAULT_SIZE = 'استاندارد';

// Manual decisions for groups the matcher can't settle, keyed by any Holoo
// code in the group: an existing product's slug, "new" or "skip" (see
// ItemOverride for the object form).
export type MatchOverrides = Record<string, ItemOverride>;

export type PlanAction =
  // Codes already imported. `mergeFrom`: other products some of the codes
  // are linked to, now grouped as sizes of this one (see holoo-matches.json).
  | {
      kind: 'linked';
      productId: string;
      productName: string;
      mergeFrom: string[];
    }
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
  // Variants moved onto the product their group was merged into, and the
  // products archived because a merge left them without variants.
  movedVariants: number;
  archivedProducts: string[];
  // Rows not written because their size on the target product is already
  // linked to a different Holoo code (two Holoo items for one variant).
  conflicts: string[];
}

// Writes parsed Holoo rows into the catalog. Holoo owns price/stock/code
// (see ProductVariant); everything else -- description, images, status --
// belongs to the site, so an existing product is never touched beyond its
// variants -- except that a duplicate page emptied by a merge (codes that
// holoo-matches.json now groups as sizes of one product) is archived.
// Each group is resolved, in order, to: the product its Holoo
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
      movedVariants: 0,
      archivedProducts: [],
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
        const merging = action.kind === 'linked' && action.mergeFrom.length > 0;
        for (const item of group.items) {
          await this.upsertVariant(manager, productId, item, summary, merging);
        }
        if (action.kind === 'linked') {
          await this.archiveEmptied(manager, action.mergeFrom, summary);
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
    const override = codes
      .map((code) => overrideTarget(overrides[code]))
      .find(Boolean);

    const known = await manager.find(ProductVariant, {
      where: { accountingId: In(codes) },
      relations: { product: true },
    });
    if (known.length > 0) {
      // Codes on several products: holoo-matches.json now groups them as
      // sizes of one product, so the others are merged into it.
      const preferred = candidates.find(
        (candidate) => candidate.slug === override,
      )?.id;
      const targetId = pickMergeTarget(
        codes,
        known.map((variant) => ({
          code: variant.accountingId!,
          productId: variant.productId,
        })),
        preferred,
      )!;
      const target = known.find((variant) => variant.productId === targetId)!;
      return {
        kind: 'linked',
        productId: targetId,
        productName: target.product.name,
        mergeFrom: [
          ...new Set(
            known
              .map((variant) => variant.productId)
              .filter((id) => id !== targetId),
          ),
        ],
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
        mergeFrom: [],
      };
    }

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
    merging = false,
  ): Promise<void> {
    const size = item.size ?? DEFAULT_SIZE;
    // Matched by Holoo code first; otherwise adopt an unlinked variant of
    // the same size (e.g. one imported from teb-sanat.com before Holoo).
    let variant = await manager.findOneBy(ProductVariant, {
      accountingId: item.code,
    });
    // In a merge the variant moves onto the target product and takes the
    // size holoo-matches.json gives it (its old page called it "استاندارد").
    const moving = variant !== null && variant.productId !== productId;
    const resizing =
      variant !== null &&
      merging &&
      item.size !== null &&
      variant.size !== size;
    if (variant && (moving || resizing)) {
      const newSize = item.size ?? variant.size;
      const taken = await manager.findOneBy(ProductVariant, {
        productId,
        size: newSize,
      });
      if (taken && taken.id !== variant.id) {
        summary.conflicts.push(
          `«${item.name}» (${item.code}): size ${newSize} is already used on the merged product${taken.accountingId ? ` by Holoo code ${taken.accountingId}` : ''}`,
        );
        return;
      }
      variant.productId = productId;
      variant.size = newSize;
      if (moving) summary.movedVariants += 1;
    }
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

  // A product a merge left without variants is a duplicate page now; it is
  // archived (never deleted), so it disappears from the store but stays
  // recoverable in the admin panel.
  private async archiveEmptied(
    manager: EntityManager,
    productIds: string[],
    summary: HolooImportSummary,
  ): Promise<void> {
    for (const id of productIds) {
      if (await manager.existsBy(ProductVariant, { productId: id })) continue;
      const product = await manager.findOneBy(Product, { id });
      if (!product || product.status === ProductStatus.ARCHIVED) continue;
      product.status = ProductStatus.ARCHIVED;
      await manager.save(product);
      summary.archivedProducts.push(product.slug);
    }
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
