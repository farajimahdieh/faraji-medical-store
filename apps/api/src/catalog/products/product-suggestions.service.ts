import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Product, ProductStatus } from '../entities/product.entity';
import { Category } from '../entities/category.entity';
import { Brand } from '../entities/brand.entity';
import {
  normalizedSqlColumn,
  normalizeSearchQuery,
} from '../../common/persian-search.util';
import { PublicSuggestion } from './suggestion.public';
import {
  compareRanked,
  RANK_BRAND,
  RANK_FUZZY,
  RANK_SUBCATEGORY,
  Ranked,
  rankForProductName,
  rankForSecondaryField,
} from './suggestion-ranking';

// Suggestions must work from the very first keystroke (a single Persian
// or Latin character) — see suggestion-ranking.ts for how a 1-character
// query still gets ranked sensibly instead of dumping everything that
// happens to contain it.
const MIN_QUERY_LENGTH = 1;
// Below this many precise (prefix/contains) hits, top up with a fuzzy
// (trigram) pass so a small typo doesn't come back empty-handed. Tuned
// against real catalog data: unrelated queries score ~0.05, genuine typos
// of short Persian compound words (e.g. "مچند" for "مچ‌بند") score as low
// as ~0.15 — see product-suggestions.service.spec.ts.
const FUZZY_SIMILARITY_THRESHOLD = 0.15;

// See the `.limit()` calls below for why these are flat caps rather than
// scaled off the requested `limit`.
const PRODUCT_CANDIDATE_POOL_LIMIT = 200;
const SECONDARY_CANDIDATE_POOL_LIMIT = 50;

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  brandName: string | null;
  imageUrl: string | null;
}

@Injectable()
export class ProductSuggestionsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Brand)
    private readonly brandRepo: Repository<Brand>,
  ) {}

  async getSuggestions(
    rawQuery: string | undefined,
    limit: number,
  ): Promise<PublicSuggestion[]> {
    const normalized = normalizeSearchQuery(rawQuery ?? '');
    if (normalized.length < MIN_QUERY_LENGTH) return [];

    const term = `%${normalized}%`;

    const [productRows, categoryRows, brandRows] = await Promise.all([
      this.productRepo
        .createQueryBuilder('product')
        .leftJoin('product.brand', 'brand')
        .leftJoin('product.images', 'image', 'image."isPrimary" = :isPrimary', {
          isPrimary: true,
        })
        .where('product.status = :status', { status: ProductStatus.ACTIVE })
        .andWhere(
          `(${normalizedSqlColumn('product.name')} ILIKE :term OR EXISTS (
            SELECT 1 FROM product_sources src
            WHERE src."productId" = product.id
              AND ${normalizedSqlColumn('src."externalProductCode"')} ILIKE :term
          ))`,
          { term },
        )
        .select('product.id', 'id')
        .addSelect('product.name', 'name')
        .addSelect('product.slug', 'slug')
        .addSelect('brand.name', 'brandName')
        .addSelect('image.url', 'imageUrl')
        // A short (even 1-character) query can match most of the catalog —
        // ranking happens in JS below, so this pool must cover every
        // candidate the ranker might need to see, not just `limit`'s worth.
        // A flat, generous cap (rather than scaling off `limit`) is what
        // keeps that ranking correct: capping relative to `limit` risks
        // truncating the pool before a better-ranked row (e.g. a
        // starts-with match sorted late by the DB) is even fetched. This
        // is still a real LIMIT, not a full unbounded scan — just sized to
        // the catalog rather than the page.
        .limit(PRODUCT_CANDIDATE_POOL_LIMIT)
        .getRawMany<ProductRow>(),

      this.categoryRepo
        .createQueryBuilder('category')
        .where('category.isActive = true')
        .andWhere('category."parentId" IS NOT NULL')
        .andWhere(`${normalizedSqlColumn('category.name')} ILIKE :term`, {
          term,
        })
        .select(['category.id', 'category.name', 'category.slug'])
        // The whole catalog only has a couple dozen subcategories — no
        // per-`limit` scaling needed to keep ranking correct here.
        .limit(SECONDARY_CANDIDATE_POOL_LIMIT)
        .getMany(),

      this.brandRepo
        .createQueryBuilder('brand')
        .where(`${normalizedSqlColumn('brand.name')} ILIKE :term`, { term })
        .select(['brand.id', 'brand.name', 'brand.slug'])
        .limit(SECONDARY_CANDIDATE_POOL_LIMIT)
        .getMany(),
    ]);

    const ranked: Ranked<PublicSuggestion>[] = [];

    for (const row of productRows) {
      const normalizedName = normalizeSearchQuery(row.name);
      ranked.push({
        rank: rankForProductName(normalizedName, normalized),
        length: normalizedName.length,
        value: this.toProductSuggestion(row),
      });
    }

    for (const category of categoryRows) {
      const normalizedName = normalizeSearchQuery(category.name);
      ranked.push({
        rank: rankForSecondaryField(
          normalizedName,
          normalized,
          RANK_SUBCATEGORY,
        ),
        length: normalizedName.length,
        value: {
          type: 'subcategory',
          label: category.name,
          slug: category.slug,
        },
      });
    }

    for (const brand of brandRows) {
      const normalizedName = normalizeSearchQuery(brand.name);
      ranked.push({
        rank: rankForSecondaryField(normalizedName, normalized, RANK_BRAND),
        length: normalizedName.length,
        value: { type: 'brand', label: brand.name, slug: brand.slug },
      });
    }

    ranked.sort(compareRanked);
    const precise = ranked.slice(0, limit);

    if (precise.length >= limit) {
      return precise.map((row) => row.value);
    }

    // Typo-tolerant fallback: only runs when precise matches didn't fill
    // the page, and only ever tops it up — never replaces a precise hit.
    const excludeIds = productRows.map((row) => row.id);
    const fuzzyRows = await this.productRepo
      .createQueryBuilder('product')
      .leftJoin('product.brand', 'brand')
      .leftJoin('product.images', 'image', 'image."isPrimary" = :isPrimary', {
        isPrimary: true,
      })
      .where('product.status = :status', { status: ProductStatus.ACTIVE })
      .andWhere(
        `similarity(${normalizedSqlColumn('product.name')}, :normalized) > :threshold`,
        { normalized, threshold: FUZZY_SIMILARITY_THRESHOLD },
      )
      .andWhere(
        excludeIds.length > 0 ? 'product.id NOT IN (:...excludeIds)' : '1=1',
        excludeIds.length > 0 ? { excludeIds } : {},
      )
      .select('product.id', 'id')
      .addSelect('product.name', 'name')
      .addSelect('product.slug', 'slug')
      .addSelect('brand.name', 'brandName')
      .addSelect('image.url', 'imageUrl')
      .addSelect(
        `similarity(${normalizedSqlColumn('product.name')}, :normalized)`,
        'sim',
      )
      .orderBy('sim', 'DESC')
      .limit(limit - precise.length)
      .getRawMany<ProductRow>();

    const fuzzy: Ranked<PublicSuggestion>[] = fuzzyRows.map((row) => ({
      rank: RANK_FUZZY,
      length: row.name.length,
      value: this.toProductSuggestion(row),
    }));

    return [...precise, ...fuzzy].map((row) => row.value);
  }

  private toProductSuggestion(row: ProductRow): PublicSuggestion {
    return {
      type: 'product',
      id: row.id,
      label: row.name,
      slug: row.slug,
      brand: row.brandName ?? null,
      image: row.imageUrl ?? null,
    };
  }
}
