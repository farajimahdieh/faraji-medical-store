import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ProductImage } from '../entities/product-image.entity';
import { ImageService } from '../../storage/image.service';
import { StorageService } from '../../storage/storage.service';
import { UpdateProductImageDto } from './dto/update-product-image.dto';
import { AuditLogService } from '../../admin/audit-log.service';

// Kept separate from AdminProductsService so image handling (upload/replace/
// delete/reorder, all backed by ImageService + StorageService) doesn't grow
// that file past a product's plain field edits.
@Injectable()
export class ProductImagesService {
  constructor(
    @InjectRepository(ProductImage)
    private readonly imageRepo: Repository<ProductImage>,
    private readonly imageService: ImageService,
    private readonly storageService: StorageService,
    private readonly auditLog: AuditLogService,
  ) {}

  async upload(
    productId: string,
    files: Express.Multer.File[],
    actorId: string,
  ): Promise<ProductImage[]> {
    if (files.length === 0) {
      throw new BadRequestException('حداقل یک فایل ارسال کنید');
    }

    const isFirstUpload =
      (await this.imageRepo.count({ where: { productId } })) === 0;
    let sortOrder = await this.nextSortOrder(productId);

    const created: ProductImage[] = [];
    for (const [index, file] of files.entries()) {
      const { objectKey, thumbnailKey } =
        await this.imageService.uploadProductImage(productId, file);
      created.push(
        await this.imageRepo.save(
          this.imageRepo.create({
            productId,
            url: this.storageService.resolveUrl(objectKey),
            objectKey,
            thumbnailKey,
            sortOrder: sortOrder++,
            isPrimary: isFirstUpload && index === 0,
          }),
        ),
      );
    }
    await this.auditLog.record(
      actorId,
      'product-image.upload',
      'product',
      productId,
      {
        count: created.length,
      },
    );
    return created;
  }

  async replace(
    productId: string,
    imageId: string,
    file: Express.Multer.File,
    actorId: string,
  ): Promise<ProductImage> {
    const image = await this.findOwn(productId, imageId);
    const { objectKey, thumbnailKey } =
      await this.imageService.uploadProductImage(productId, file);

    const { objectKey: oldObjectKey, thumbnailKey: oldThumbnailKey } = image;
    image.url = this.storageService.resolveUrl(objectKey);
    image.objectKey = objectKey;
    image.thumbnailKey = thumbnailKey;
    await this.imageRepo.save(image);

    // Delete the old files only after the new ones are safely stored and
    // saved -- a failed upload never leaves the product imageless.
    await this.imageService.deleteProductImage(oldObjectKey, oldThumbnailKey);
    await this.auditLog.record(
      actorId,
      'product-image.replace',
      'product',
      productId,
      {
        imageId,
      },
    );
    return image;
  }

  async updateMeta(
    productId: string,
    imageId: string,
    dto: UpdateProductImageDto,
  ): Promise<ProductImage> {
    const image = await this.findOwn(productId, imageId);
    if (dto.altText !== undefined) image.altText = dto.altText;

    if (dto.isPrimary) {
      await this.imageRepo.update({ productId }, { isPrimary: false });
      image.isPrimary = true;
    }

    return this.imageRepo.save(image);
  }

  async reorder(productId: string, orderedImageIds: string[]): Promise<void> {
    const images = await this.imageRepo.find({ where: { productId } });
    const knownIds = new Set(images.map((image) => image.id));

    if (
      orderedImageIds.length !== images.length ||
      orderedImageIds.some((id) => !knownIds.has(id))
    ) {
      throw new BadRequestException(
        'لیست تصاویر با تصاویر این محصول مطابقت ندارد',
      );
    }

    await Promise.all(
      orderedImageIds.map((id, sortOrder) =>
        this.imageRepo.update({ id }, { sortOrder }),
      ),
    );
  }

  async remove(
    productId: string,
    imageId: string,
    actorId: string,
  ): Promise<void> {
    const image = await this.findOwn(productId, imageId);
    await this.imageService.deleteProductImage(
      image.objectKey,
      image.thumbnailKey,
    );
    await this.imageRepo.remove(image);

    if (image.isPrimary) {
      const next = await this.imageRepo.findOne({
        where: { productId },
        order: { sortOrder: 'ASC' },
      });
      if (next) {
        next.isPrimary = true;
        await this.imageRepo.save(next);
      }
    }

    await this.auditLog.record(
      actorId,
      'product-image.delete',
      'product',
      productId,
      {
        imageId,
      },
    );
  }

  private async findOwn(
    productId: string,
    imageId: string,
  ): Promise<ProductImage> {
    const image = await this.imageRepo.findOne({
      where: { id: imageId, productId },
    });
    if (!image) {
      throw new NotFoundException('تصویر یافت نشد');
    }
    return image;
  }

  private async nextSortOrder(productId: string): Promise<number> {
    const last = await this.imageRepo.findOne({
      where: { productId },
      order: { sortOrder: 'DESC' },
    });
    return (last?.sortOrder ?? -1) + 1;
  }
}
