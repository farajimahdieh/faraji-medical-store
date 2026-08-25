import { Transform, TransformFnParams } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

function trimIfString({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class UpdateAddressDto {
  @IsOptional()
  @Transform(trimIfString)
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @Transform(trimIfString)
  @IsString()
  @MaxLength(150)
  recipientName?: string;

  @IsOptional()
  @Transform(trimIfString)
  @IsString()
  recipientPhone?: string;

  @IsOptional()
  @Transform(trimIfString)
  @IsString()
  @MaxLength(100)
  province?: string;

  @IsOptional()
  @Transform(trimIfString)
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @Transform(trimIfString)
  @IsString()
  @MaxLength(500)
  addressLine?: string;

  @IsOptional()
  @Transform(trimIfString)
  @IsString()
  @Matches(/^\d{10}$/, { message: 'کد پستی باید ۱۰ رقم باشد' })
  postalCode?: string;

  @IsOptional()
  @Transform(trimIfString)
  @IsString()
  @MaxLength(20)
  buildingNumber?: string | null;

  @IsOptional()
  @Transform(trimIfString)
  @IsString()
  @MaxLength(20)
  unit?: string | null;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
