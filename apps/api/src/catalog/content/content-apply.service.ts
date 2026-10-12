import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, EntityManager } from 'typeorm';
import { readFile } from 'node:fs/promises';
import { basename, resolve, sep } from 'node:path';
import sharp from 'sharp';

import { Brand } from '../entities/brand.entity';
import { Product, ProductStatus } from '../entities/product.entity';
import { ProductFeature } from '../entities/product-feature.entity';
import { ProductSpecification } from '../entities/product-specification.entity';
import { ProductFaq } from '../entities/product-faq.entity';
import { ProductImage } from '../entities/product-image.entity';
import { ImageService } from '../../storage/image.service';
import { StorageService } from '../../storage/storage.service';
import { ProductContent, ProductContentImage } from './product-content';

const DOWNLOAD_TIMEOUT_MS = 20_000;
const UPLOAD_FORMATS = new Set(['jpeg', 'png', 'webp']);

export interface ApplyResult {
  slug: string;
  messages: string[];
  imagesAdded: number;
}

// Writes one validated content file into the catalog. The file is the
// source of truth for text (features/specs/FAQs are replaced wholesale);
// images are additive -- one already imported from the same source is
// skipped, admin uploads are never removed. Images go through the same
// ImageService as admin uploads, so they land in whichever storage
// STORAGE_DRIVER selects (Arvan in production).
//
// A product is never published from here: an incomplete one moves to
// NEEDS_REVIEW and waits for an admin to approve it.
@Injectable()
export class ContentApplyService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly imageService: ImageService,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {}

  async apply(content: ProductContent, repoRoot: string): Promise<ApplyResult> {
    const result: ApplyResult = {
      slug: content.slug,
      messages: [],
      imagesAdded: 0,
    };

    const product = await this.dataSource.manager.findOneBy(Product, {
      slug: content.slug,
    });
    if (!product) {
      throw new Error(
        `no product with slug "${content.slug}" -- run import:holoo first or fix the slug`,
      );
    }

    await this.dataSource.transaction(async (manager) => {
      await this.applyText(manager, product, content, result);
    });

    if (product.imagesLocked) {
      result.messages.push('images locked by an admin -- images skipped');
    } else {
      await this.applyImages(product, content, repoRoot, result);
    }

    await this.promote(product, result);
    return result;
  }

  private async applyText(
    manager: EntityManager,
    product: Product,
    content: ProductContent,
    result: ApplyResult,
  ): Promise<void> {
    if (content.name) product.name = content.name;
    if (content.brand) {
      product.brandId = (
        await this.findOrCreateBrand(manager, content.brand)
      ).id;
    }
    if (product.descriptionLocked) {
      result.messages.push(
        'description locked by an admin -- descriptions skipped',
      );
    } else {
      product.shortDescription = content.shortDescription;
      product.description = content.description;
    }
    product.metaTitle = content.metaTitle;
    product.metaDescription = content.metaDescription;
    await manager.save(product);

    const productId = product.id;
    await manager.delete(ProductFeature, { productId });
    await manager.delete(ProductSpecification, { productId });
    await manager.delete(ProductFaq, { productId });
    await manager.save(
      content.features.map((text, sortOrder) =>
        manager.create(ProductFeature, { productId, text, sortOrder }),
      ),
    );
    await manager.save(
      content.specifications.map(({ name, value }, sortOrder) =>
        manager.create(ProductSpecification, {
          productId,
          name,
          value,
          sortOrder,
        }),
      ),
    );
    await manager.save(
      content.faqs.map(({ question, answer }, sortOrder) =>
        manager.create(ProductFaq, { productId, question, answer, sortOrder }),
      ),
    );
  }

  private async applyImages(
    product: Product,
    content: ProductContent,
    repoRoot: string,
    result: ApplyResult,
  ): Promise<void> {
    const imageRepo = this.dataSource.getRepository(ProductImage);
    const existing = await imageRepo.findBy({ productId: product.id });
    const knownSources = new Set(existing.map((image) => image.sourceUrl));
    let hasPrimary = existing.some((image) => image.isPrimary);
    let sortOrder = existing.reduce(
      (max, image) => Math.max(max, image.sortOrder + 1),
      0,
    );

    for (const image of content.images) {
      const sourceKey = image.url ?? `file:${basename(image.file!)}`;
      if (knownSources.has(sourceKey)) continue;

      try {
        const buffer = await this.loadImage(image, repoRoot);
        const { objectKey, thumbnailKey } =
          await this.imageService.uploadProductImage(
            product.id,
            await this.asUpload(buffer),
          );
        await imageRepo.save(
          imageRepo.create({
            productId: product.id,
            url: this.storageService.resolveUrl(objectKey),
            objectKey,
            thumbnailKey,
            altText: image.alt,
            sortOrder: sortOrder++,
            isPrimary: !hasPrimary,
            sourceUrl: sourceKey,
          }),
        );
        hasPrimary = true;
        knownSources.add(sourceKey);
        result.imagesAdded += 1;
      } catch (error) {
        result.messages.push(
          `image failed (${sourceKey}): ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }

  private async loadImage(
    image: ProductContentImage,
    repoRoot: string,
  ): Promise<Buffer> {
    const maxBytes =
      Number(this.configService.get('UPLOAD_MAX_FILE_SIZE_MB', '8')) *
      1024 *
      1024;

    if (image.file) {
      const root = resolve(repoRoot);
      const path = resolve(root, image.file);
      if (!path.startsWith(root + sep)) {
        throw new Error('file path escapes the repository');
      }
      return readFile(path);
    }

    const response = await fetch(image.url!, {
      signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
      redirect: 'follow',
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const declared = Number(response.headers.get('content-length') ?? 0);
    if (declared > maxBytes) throw new Error('image is too large');
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > maxBytes) throw new Error('image is too large');
    return buffer;
  }

  // ImageService validates like a browser upload (MIME + decoded format);
  // re-encode anything else sharp can read (AVIF, GIF, ...) to PNG first.
  private async asUpload(buffer: Buffer): Promise<Express.Multer.File> {
    const { format } = await sharp(buffer).metadata();
    if (!format) throw new Error('not an image');
    const data = UPLOAD_FORMATS.has(format)
      ? buffer
      : await sharp(buffer).png().toBuffer();
    const finalFormat = UPLOAD_FORMATS.has(format) ? format : 'png';
    return {
      buffer: data,
      mimetype: `image/${finalFormat}`,
      size: data.length,
    } as Express.Multer.File;
  }

  private async promote(product: Product, result: ApplyResult): Promise<void> {
    if (
      product.status !== ProductStatus.INCOMPLETE &&
      product.status !== ProductStatus.DRAFT
    ) {
      return;
    }
    const hasImage = await this.dataSource
      .getRepository(ProductImage)
      .existsBy({ productId: product.id, isPrimary: true });
    if (!hasImage || !product.description) return;

    await this.dataSource
      .getRepository(Product)
      .update(product.id, { status: ProductStatus.NEEDS_REVIEW });
    result.messages.push('ready for review in the admin panel');
  }

  private async findOrCreateBrand(
    manager: EntityManager,
    name: string,
  ): Promise<Brand> {
    const existing = await manager.findOneBy(Brand, { name });
    if (existing) return existing;
    const slug =
      name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9؀-ۿ]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'brand';
    return manager.save(manager.create(Brand, { name, slug }));
  }
}
