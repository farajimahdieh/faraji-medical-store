import { IsBoolean, IsOptional, IsString } from 'class-validator';

// price/stock are deliberately absent -- see create-variant.dto.ts.
export class UpdateVariantDto {
  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
