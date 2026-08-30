import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import {
  DiscountType,
  CouponAudienceType,
} from '../entities/discount-code.entity';

export class CreateCouponDto {
  @IsString()
  code: string;

  @IsEnum(DiscountType)
  type: DiscountType;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  value: number;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usageLimit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usagePerUser?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minimumOrderAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxDiscountAmount?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(CouponAudienceType)
  audienceType?: CouponAudienceType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  audienceMonths?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  audienceMinOrders?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  audienceMinSpend?: number;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  audienceUserIds?: string[];

  @IsOptional()
  @IsString()
  internalReason?: string;

  @IsOptional()
  @IsString()
  campaignName?: string;
}
