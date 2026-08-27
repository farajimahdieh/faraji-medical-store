import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { processProductImage } from './image-processor';
import { StorageService } from './storage.service';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_FORMATS = new Set(['jpeg', 'png', 'webp']);

export interface UploadedProductImage {
  objectKey: string;
  thumbnailKey: string;
}

// Orchestrates a raw upload into stored WebP variants: validate -> resize/
// re-encode (image-processor.ts) -> upload both sizes (StorageService).
// Multer keeps the file in memory (see product-images.controller.ts), so
// there's never a temp file on disk to clean up here.
@Injectable()
export class ImageService {
  constructor(
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {}

  async uploadProductImage(
    productId: string,
    file: Express.Multer.File,
  ): Promise<UploadedProductImage> {
    await this.validate(file);

    const variants = await processProductImage(file.buffer);
    const detail = variants.find((variant) => variant.name === 'detail')!;
    const card = variants.find((variant) => variant.name === 'card')!;

    const id = randomUUID();
    const objectKey = `products/${productId}/${id}-detail.webp`;
    const thumbnailKey = `products/${productId}/${id}-card.webp`;

    await Promise.all([
      this.storageService.upload(objectKey, detail.buffer, detail.contentType),
      this.storageService.upload(thumbnailKey, card.buffer, card.contentType),
    ]);

    return { objectKey, thumbnailKey };
  }

  async deleteProductImage(
    objectKey: string | null,
    thumbnailKey: string | null,
  ): Promise<void> {
    await Promise.all([
      objectKey ? this.storageService.delete(objectKey) : undefined,
      thumbnailKey ? this.storageService.delete(thumbnailKey) : undefined,
    ]);
  }

  private async validate(file: Express.Multer.File): Promise<void> {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException('فرمت فایل مجاز نیست');
    }

    const maxSizeMb = Number(
      this.configService.get('UPLOAD_MAX_FILE_SIZE_MB', '8'),
    );
    if (file.size > maxSizeMb * 1024 * 1024) {
      throw new BadRequestException(
        `حجم فایل نباید بیشتر از ${maxSizeMb} مگابایت باشد`,
      );
    }

    // Never trust the client-supplied MIME header alone -- confirm the
    // bytes actually decode as one of the allowed formats.
    const metadata = await sharp(file.buffer)
      .metadata()
      .catch(() => null);
    if (!metadata?.format || !ALLOWED_FORMATS.has(metadata.format)) {
      throw new BadRequestException('فایل تصویر معتبر نیست');
    }
  }
}
