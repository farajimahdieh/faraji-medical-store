import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

// status is deliberately absent -- it only changes through the review
// workflow (AdminProductsService.approve/reject), never a free-form edit.
export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUUID()
  brandId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}
