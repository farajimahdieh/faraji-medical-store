import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { join } from 'node:path';

import { Brand } from '../../entities/brand.entity';
import { Category } from '../../entities/category.entity';
import { Product, ProductStatus } from '../../entities/product.entity';
import { ProductVariant } from '../../entities/product-variant.entity';
import { ProductImage } from '../../entities/product-image.entity';
import { ProductFeature } from '../../entities/product-feature.entity';
import { ProductSource } from '../../entities/product-source.entity';
import { STORAGE_PROVIDER } from '../../../storage/storage-provider.interface';
import type { StorageProvider } from '../../../storage/storage-provider.interface';
import { processProductImage } from '../../../storage/image-processor';

import { TebSanatClient } from './teb-sanat-client';
import {
  NormalizedProduct,
  normalizeSourceProduct,
} from './product-normalizer';
import { normalizeForMatching, ProductMatcher } from './product-matcher';
import {
  FALLBACK_SUBCATEGORY,
  IMPORTABLE_TEB_SANAT_CATEGORIES,
  resolveProductInclusion,
} from './category-map';
import { TebSanatProduct } from './teb-sanat.types';

const SOURCE_NAME = 'teb-sanat';
const BRAND_NAME = 'طب و صنعت';
const BRAND_SLUG = 'teb-o-sanat';
const BRAND_WEBSITE = 'https://teb-sanat.com';
const ROOT_CATEGORY_NAME = 'ارتوپدی، حرکتی و توانبخشی';
const ROOT_CATEGORY_SLUG = 'orthopedic-mobility-rehab';

export interface ImportOptions {
  dryRun: boolean;
  limit?: number;
  useCache: boolean;
}

export type ImportOutcome = 'new' | 'existing' | 'excluded' | 'failed';

export interface ImportLogEntry {
  productName: string;
  outcome: ImportOutcome;
  needsReview: boolean;
  message?: string;
}

export interface ImportSummary {
  found: number;
  processed: number;
  created: number;
  updated: number;
  needsReview: number;
  excluded: number;
  failed: number;
  entries: ImportLogEntry[];
}

@Injectable()
export class TebSanatImportService {
  private readonly logger = new Logger(TebSanatImportService.name);

  constructor(
    @InjectRepository(Brand) private readonly brandRepo: Repository<Brand>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,
    @InjectRepository(ProductImage)
    private readonly imageRepo: Repository<ProductImage>,
    @InjectRepository(ProductFeature)
    private readonly featureRepo: Repository<ProductFeature>,
    @InjectRepository(ProductSource)
    private readonly sourceRepo: Repository<ProductSource>,
    @Inject(STORAGE_PROVIDER)
    private readonly storage: StorageProvider,
    private readonly matcher: ProductMatcher,
  ) {}

  async run(options: ImportOptions): Promise<ImportSummary> {
    const client = new TebSanatClient({
      useCache: options.useCache,
      cacheDir: join(process.cwd(), '.import-cache', 'teb-sanat'),
    });

    const rawProducts = await this.discoverProducts(client);
    const summary: ImportSummary = {
      found: rawProducts.length,
      processed: 0,
      created: 0,
      updated: 0,
      needsReview: 0,
      excluded: 0,
      failed: 0,
      entries: [],
    };

    const toProcess = options.limit
      ? rawProducts.slice(0, options.limit)
      : rawProducts;

    // Read-only lookups — safe to run even in dry-run mode. Brand/root
    // category rows are only ever *created* on the write path below.
    const existingBrand = await this.brandRepo.findOneBy({ slug: BRAND_SLUG });
    const existingByName = existingBrand
      ? await this.matcher.loadExistingByBrand(existingBrand.id)
      : new Map<string, Product>();
    const tebSanatSourceCodesByProductId =
      await this.matcher.loadTebSanatSourceCodesByProductId();

    for (const { product: raw, categoryIds } of toProcess) {
      const normalized = normalizeSourceProduct(raw, categoryIds);
      summary.processed++;

      const inclusion = resolveProductInclusion(normalized.sourceProductId);
      if (inclusion === 'exclude') {
        summary.excluded++;
        this.logger.log(
          `⊘ Excluded (not orthopedic-related): ${normalized.name}`,
        );
        summary.entries.push({
          productName: normalized.name,
          outcome: 'excluded',
          needsReview: false,
        });
        continue;
      }

      const needsReview =
        inclusion === 'needs_review' ||
        normalized.subcategory.slug === FALLBACK_SUBCATEGORY.slug ||
        normalized.sizes.length === 0;
      if (needsReview) summary.needsReview++;

      const existingProduct = await this.matcher.findExisting(
        normalized,
        existingByName,
        tebSanatSourceCodesByProductId,
      );

      try {
        if (options.dryRun) {
          if (existingProduct) summary.updated++;
          else summary.created++;
          summary.entries.push({
            productName: normalized.name,
            outcome: existingProduct ? 'existing' : 'new',
            needsReview,
          });
          continue;
        }

        const brand = await this.ensureBrand(
          BRAND_NAME,
          BRAND_SLUG,
          BRAND_WEBSITE,
        );
        const rootCategory = await this.ensureCategory(
          ROOT_CATEGORY_NAME,
          ROOT_CATEGORY_SLUG,
          null,
        );

        const { product, created } = await this.upsertProduct(
          normalized,
          existingProduct,
          brand,
          rootCategory,
        );
        if (created) {
          existingByName.set(normalizeForMatching(product.name), product);
          // Keep this map current within the same run too — otherwise a
          // second, different-SKU product sharing this exact name (seen
          // later in the same run) would incorrectly match it via the
          // name fallback in ProductMatcher.findExisting.
          tebSanatSourceCodesByProductId.set(product.id, normalized.sku);
        }

        await this.upsertVariants(product, normalized.sizes);
        await this.upsertFeatures(product, normalized.features);
        const hasPrimaryImage = await this.upsertImages(
          client,
          product,
          normalized,
        );

        product.status = this.resolveStatus(
          product,
          hasPrimaryImage,
          inclusion === 'needs_review',
        );
        await this.productRepo.save(product);

        if (created) summary.created++;
        else summary.updated++;

        this.logger.log(
          `${created ? '✓ Imported' : '↻ Updated'}: ${normalized.name}`,
        );
        summary.entries.push({
          productName: normalized.name,
          outcome: created ? 'new' : 'existing',
          needsReview,
        });
      } catch (error) {
        summary.failed++;
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`✗ Failed: ${normalized.name} — ${message}`);
        summary.entries.push({
          productName: normalized.name,
          outcome: 'failed',
          needsReview,
          message,
        });
      }
    }

    return summary;
  }

  // Tracks, per product id, every allowlisted category it was actually
  // found under while crawling — see the comment on normalizeSourceProduct
  // for why this is more trustworthy than the product's own `categories`
  // field on this particular source site.
  private async discoverProducts(
    client: TebSanatClient,
  ): Promise<Array<{ product: TebSanatProduct; categoryIds: number[] }>> {
    const byId = new Map<
      number,
      { product: TebSanatProduct; categoryIds: number[] }
    >();
    for (const categoryId of Object.keys(IMPORTABLE_TEB_SANAT_CATEGORIES).map(
      Number,
    )) {
      const products = await client.fetchAllProductsForCategory(categoryId);
      for (const product of products) {
        const entry = byId.get(product.id);
        if (entry) entry.categoryIds.push(categoryId);
        else byId.set(product.id, { product, categoryIds: [categoryId] });
      }
    }
    return Array.from(byId.values());
  }

  private async ensureBrand(
    name: string,
    slug: string,
    website: string,
  ): Promise<Brand> {
    const existing = await this.brandRepo.findOneBy({ slug });
    if (existing) return existing;
    return this.brandRepo.save(this.brandRepo.create({ name, slug, website }));
  }

  private async ensureCategory(
    name: string,
    slug: string,
    parentId: string | null,
  ): Promise<Category> {
    const existing = await this.categoryRepo.findOneBy({ slug });
    if (existing) return existing;
    return this.categoryRepo.save(
      this.categoryRepo.create({ name, slug, parentId }),
    );
  }

  private async upsertProduct(
    normalized: NormalizedProduct,
    existing: Product | null,
    brand: Brand,
    rootCategory: Category,
  ): Promise<{ product: Product; created: boolean }> {
    const subcategory = await this.ensureCategory(
      normalized.subcategory.name,
      normalized.subcategory.slug,
      rootCategory.id,
    );

    if (existing) {
      if (!existing.descriptionLocked) {
        existing.shortDescription = normalized.shortDescription;
        existing.description = normalized.description;
        existing.videoUrl = normalized.videoUrl;
        existing.videoSource = normalized.videoSource;
      }
      existing.categoryId = existing.categoryId ?? subcategory.id;
      existing.brandId = existing.brandId ?? brand.id;
      const saved = await this.productRepo.save(existing);
      await this.upsertSource(saved.id, normalized);
      return { product: saved, created: false };
    }

    const product = await this.productRepo.save(
      this.productRepo.create({
        name: normalized.name,
        slug: await this.uniqueSlug(normalized.slug),
        brandId: brand.id,
        categoryId: subcategory.id,
        shortDescription: normalized.shortDescription,
        description: normalized.description,
        videoUrl: normalized.videoUrl,
        videoSource: normalized.videoSource,
        status: ProductStatus.INCOMPLETE,
      }),
    );
    await this.upsertSource(product.id, normalized);
    return { product, created: true };
  }

  private async uniqueSlug(candidate: string): Promise<string> {
    const existing = await this.productRepo.findOneBy({ slug: candidate });
    if (!existing) return candidate;
    this.logger.warn(`Slug collision on "${candidate}", disambiguating`);
    return `${candidate}-${Date.now()}`;
  }

  private async upsertSource(
    productId: string,
    normalized: NormalizedProduct,
  ): Promise<void> {
    const existing = await this.sourceRepo.findOneBy({
      sourceName: SOURCE_NAME,
      externalProductCode: normalized.sku,
    });
    if (existing) {
      existing.sourceUrl = normalized.sourceUrl;
      existing.lastImportedAt = new Date();
      await this.sourceRepo.save(existing);
      return;
    }
    await this.sourceRepo.save(
      this.sourceRepo.create({
        productId,
        sourceName: SOURCE_NAME,
        sourceUrl: normalized.sourceUrl,
        externalProductCode: normalized.sku,
        lastImportedAt: new Date(),
      }),
    );
  }

  private async upsertVariants(
    product: Product,
    sizes: string[],
  ): Promise<void> {
    for (const size of sizes) {
      const existing = await this.variantRepo.findOneBy({
        productId: product.id,
        size,
      });
      if (existing) continue;
      await this.variantRepo.save(
        this.variantRepo.create({
          productId: product.id,
          size,
          accountingName: `${product.name} - ${size}`,
          accountingId: null,
          price: null,
          stock: null,
          isActive: true,
        }),
      );
    }
  }

  private async upsertFeatures(
    product: Product,
    features: string[],
  ): Promise<void> {
    if (features.length === 0) return;
    const existing = await this.featureRepo.findBy({ productId: product.id });
    const existingTexts = new Set(existing.map((feature) => feature.text));
    let sortOrder = existing.length;
    for (const text of features) {
      if (existingTexts.has(text)) continue;
      await this.featureRepo.save(
        this.featureRepo.create({ productId: product.id, text, sortOrder }),
      );
      sortOrder++;
    }
  }

  // Returns whether the product ends up with a primary image.
  private async upsertImages(
    client: TebSanatClient,
    product: Product,
    normalized: NormalizedProduct,
  ): Promise<boolean> {
    const existing = await this.imageRepo.findBy({ productId: product.id });
    if (product.imagesLocked) {
      return existing.some((image) => image.isPrimary);
    }

    const existingSourceUrls = new Set(
      existing
        .map((image) => image.sourceUrl)
        .filter((url): url is string => url !== null),
    );
    let hasPrimary = existing.some((image) => image.isPrimary);

    for (const image of normalized.images) {
      if (existingSourceUrls.has(image.sourceUrl)) continue;

      try {
        const buffer = await client.fetchBinary(image.sourceUrl);
        const [, detail] = await processProductImage(buffer);
        const key = `products/${product.slug}/${image.sortOrder}-detail.webp`;
        const stored = await this.storage.save(
          key,
          detail.buffer,
          detail.contentType,
        );

        const isPrimary = !hasPrimary;
        await this.imageRepo.save(
          this.imageRepo.create({
            productId: product.id,
            url: stored.url,
            altText: isPrimary
              ? `${product.name} - نمای اصلی`
              : `${product.name} - تصویر ${image.sortOrder + 1}`,
            sortOrder: image.sortOrder,
            isPrimary,
            sourceUrl: image.sourceUrl,
          }),
        );
        if (isPrimary) hasPrimary = true;
      } catch (error) {
        this.logger.warn(
          `⚠ Image failed for ${normalized.name} (${image.sourceUrl}): ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    return hasPrimary;
  }

  private resolveStatus(
    product: Product,
    hasPrimaryImage: boolean,
    forceNeedsReview: boolean,
  ): ProductStatus {
    if (
      product.status === ProductStatus.ARCHIVED ||
      product.status === ProductStatus.HIDDEN
    ) {
      return product.status;
    }

    const hasBasics = Boolean(
      product.name && product.categoryId && product.brandId,
    );
    if (!hasBasics || !hasPrimaryImage) {
      return ProductStatus.INCOMPLETE;
    }
    return forceNeedsReview ? ProductStatus.NEEDS_REVIEW : ProductStatus.ACTIVE;
  }
}
