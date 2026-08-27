import { Transform, TransformFnParams } from 'class-transformer';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

function trimIfString({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class CreateOrderDto {
  @IsUUID()
  addressId: string;

  @IsOptional()
  @Transform(trimIfString)
  @IsString()
  @MaxLength(100)
  shippingMethod?: string;

  @IsOptional()
  @Transform(trimIfString)
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
