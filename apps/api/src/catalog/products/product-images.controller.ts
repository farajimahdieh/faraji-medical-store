import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { ProductImagesService } from './product-images.service';
import { UpdateProductImageDto } from './dto/update-product-image.dto';
import { ReorderProductImagesDto } from './dto/reorder-product-images.dto';
import { AdminOnly } from '../../auth/decorators/admin-guards.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';

const MAX_FILES_PER_UPLOAD = 10;
const upload = { storage: memoryStorage() };

@AdminOnly()
@Controller('admin/products/:id/images')
export class ProductImagesController {
  constructor(private readonly productImagesService: ProductImagesService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files', MAX_FILES_PER_UPLOAD, upload))
  uploadImages(
    @CurrentUser() currentUser: User,
    @Param('id', ParseUUIDPipe) productId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.productImagesService.upload(productId, files, currentUser.id);
  }

  // Declared before ':imageId' so it isn't swallowed as a param value --
  // same reasoning as products.controller.ts's facets/suggestions routes.
  @Patch('reorder')
  reorder(
    @Param('id', ParseUUIDPipe) productId: string,
    @Body() dto: ReorderProductImagesDto,
  ) {
    return this.productImagesService.reorder(productId, dto.orderedImageIds);
  }

  @Post(':imageId/replace')
  @UseInterceptors(FileInterceptor('file', upload))
  replaceImage(
    @CurrentUser() currentUser: User,
    @Param('id', ParseUUIDPipe) productId: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.productImagesService.replace(
      productId,
      imageId,
      file,
      currentUser.id,
    );
  }

  @Patch(':imageId')
  updateImage(
    @Param('id', ParseUUIDPipe) productId: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
    @Body() dto: UpdateProductImageDto,
  ) {
    return this.productImagesService.updateMeta(productId, imageId, dto);
  }

  @Delete(':imageId')
  removeImage(
    @CurrentUser() currentUser: User,
    @Param('id', ParseUUIDPipe) productId: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
  ) {
    return this.productImagesService.remove(productId, imageId, currentUser.id);
  }
}
