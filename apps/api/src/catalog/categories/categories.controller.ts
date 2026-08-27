import { Controller, Get, Param } from '@nestjs/common';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // Declared before ':slug' so it isn't swallowed as a param value -- same
  // reasoning as products.controller.ts's facets/suggestions routes.
  @Get()
  list() {
    return this.categoriesService.listAll();
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.categoriesService.getBySlug(slug);
  }
}
