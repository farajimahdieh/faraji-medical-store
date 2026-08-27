import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

// price/stock are deliberately absent -- they're accounting-sync-owned
// (see product-variant.entity.ts) and never admin-writable.
export class CreateVariantDto {
  @IsString()
  @IsNotEmpty()
  size: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
