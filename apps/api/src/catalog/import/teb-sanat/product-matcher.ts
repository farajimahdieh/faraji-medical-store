import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Product } from '../../entities/product.entity';
import { ProductSource } from '../../entities/product-source.entity';
import { NormalizedProduct, normalizeProductName } from './product-normalizer';

const SOURCE_NAME = 'teb-sanat';

export function normalizeForMatching(name: string): string {
  return normalizeProductName(name).toLowerCase();
}

// Finds a product that was already imported/exists, so re-running the
// importer updates it instead of creating a duplicate. All lookups are
// read-only, so this is safe to use during a dry run too.
//
// Priority: (sourceName + externalProductCode) -> sourceUrl -> brand + normalized name.
//
// The name fallback is deliberately guarded: teb-sanat has at least two
// pairs of genuinely different products (different SKUs, e.g. an arm-cast
// vs. leg-cast version of "محافظ گچ و پانسمان در حمام") that share an
// identical display name. If a name match already has a teb-sanat source
// under a *different* SKU, it is a distinct product that happens to share
// a name — not a re-import of the same one — so the name fallback is
// skipped and a new product is created instead.
@Injectable()
export class ProductMatcher {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductSource)
    private readonly sourceRepo: Repository<ProductSource>,
  ) {}

  async loadExistingByBrand(brandId: string): Promise<Map<string, Product>> {
    const products = await this.productRepo.findBy({ brandId });
    const map = new Map<string, Product>();
    for (const product of products) {
      map.set(normalizeForMatching(product.name), product);
    }
    return map;
  }

  // Product ids that already have a teb-sanat ProductSource, keyed by
  // their externalProductCode so callers can tell "same SKU" from
  // "different SKU, same product row" apart.
  async loadTebSanatSourceCodesByProductId(): Promise<Map<string, string>> {
    const sources = await this.sourceRepo.findBy({ sourceName: SOURCE_NAME });
    const map = new Map<string, string>();
    for (const source of sources) {
      if (source.externalProductCode) {
        map.set(source.productId, source.externalProductCode);
      }
    }
    return map;
  }

  async findExisting(
    normalized: NormalizedProduct,
    existingByName: Map<string, Product>,
    tebSanatSourceCodesByProductId: Map<string, string>,
  ): Promise<Product | null> {
    const bySourceCode = await this.sourceRepo.findOne({
      where: { sourceName: SOURCE_NAME, externalProductCode: normalized.sku },
      relations: { product: true },
    });
    if (bySourceCode) return bySourceCode.product;

    const bySourceUrl = await this.sourceRepo.findOne({
      where: { sourceUrl: normalized.sourceUrl },
      relations: { product: true },
    });
    if (bySourceUrl) return bySourceUrl.product;

    const byName = existingByName.get(normalizeForMatching(normalized.name));
    if (!byName) return null;

    const existingCode = tebSanatSourceCodesByProductId.get(byName.id);
    if (existingCode && existingCode !== normalized.sku) {
      return null;
    }
    return byName;
  }
}
