import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductSuggestionsService } from './product-suggestions.service';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { ListProductFacetsQueryDto } from './dto/list-product-facets-query.dto';
import { ProductSuggestionsQueryDto } from './dto/product-suggestions-query.dto';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly productSuggestionsService: ProductSuggestionsService,
  ) {}

  @Get()
  list(@Query() query: ListProductsQueryDto) {
    return this.productsService.list(query);
  }

  // 'facets' and 'suggestions' are declared before ':slug' — Nest matches
  // routes in order, and ':slug' would otherwise swallow them as a value.
  @Get('facets')
  getFacets(@Query() query: ListProductFacetsQueryDto) {
    return this.productsService.getFacets(query);
  }

  @Get('suggestions')
  async getSuggestions(@Query() query: ProductSuggestionsQueryDto) {
    const suggestions = await this.productSuggestionsService.getSuggestions(
      query.q,
      query.limit,
    );
    return { suggestions };
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.productsService.getBySlug(slug);
  }
}
