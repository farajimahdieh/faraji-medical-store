import { Transform, TransformFnParams } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { PaymentMethod } from '../entities/order.entity';

function trimIfString({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class CreateOrderDto {
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  // Required for cash on delivery; ignored for in-store pickup.
  @IsOptional()
  @IsUUID()
  addressId?: string;

  @IsOptional()
  @Transform(trimIfString)
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
