import { IsOptional, IsUUID } from 'class-validator';

export class CheckWishlistQueryDto {
  @IsUUID()
  productId: string;

  @IsOptional()
  @IsUUID()
  variantId?: string;
}
