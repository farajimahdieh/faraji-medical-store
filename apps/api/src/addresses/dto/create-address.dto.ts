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

export class CreateAddressDto {
  @Transform(trimIfString)
  @IsString()
  @MaxLength(100)
  title: string;

  @Transform(trimIfString)
  @IsString()
  @MaxLength(150)
  recipientName: string;

  // Normalized/validated in the service via normalizeIranPhone.
  @Transform(trimIfString)
  @IsString()
  recipientPhone: string;

  @Transform(trimIfString)
  @IsString()
  @MaxLength(100)
  province: string;

  @Transform(trimIfString)
  @IsString()
  @MaxLength(100)
  city: string;

  @Transform(trimIfString)
  @IsString()
  @MaxLength(500)
  addressLine: string;

  @Transform(trimIfString)
  @IsString()
  @Matches(/^\d{10}$/, { message: 'کد پستی باید ۱۰ رقم باشد' })
  postalCode: string;

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
