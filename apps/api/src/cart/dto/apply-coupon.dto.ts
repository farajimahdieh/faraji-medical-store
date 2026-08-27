import { Transform, TransformFnParams } from 'class-transformer';
import { IsString, MaxLength } from 'class-validator';

function trimAndUppercase({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim().toUpperCase() : value;
}

export class ApplyCouponDto {
  @Transform(trimAndUppercase)
  @IsString()
  @MaxLength(50)
  code: string;
}
