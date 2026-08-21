import { IsOptional, IsString } from 'class-validator';

// Facets deliberately don't narrow by brand/size (unlike ListProductsQueryDto)
// so picking one filter doesn't hide the options for the others.
export class ListProductFacetsQueryDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  q?: string;
}
