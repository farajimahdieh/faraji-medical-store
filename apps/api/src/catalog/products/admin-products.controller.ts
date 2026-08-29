import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { AdminProductsService } from './admin-products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { RejectProductDto } from './dto/reject-product.dto';
import { AdminListProductsQueryDto } from './dto/admin-list-products-query.dto';
import { AdminOnly } from '../../auth/decorators/admin-guards.decorator';

@AdminOnly()
@Controller('admin/products')
export class AdminProductsController {
  constructor(private readonly adminProductsService: AdminProductsService) {}

  @Get()
  list(@Query() query: AdminListProductsQueryDto) {
    return this.adminProductsService.list(query);
  }

  // Declared before ':id' so it isn't swallowed as a param value -- same
  // reasoning as products.controller.ts's facets/suggestions routes.
  @Get('pending')
  listPending() {
    return this.adminProductsService.listPending();
  }

  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminProductsService.getById(id);
  }

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.adminProductsService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.adminProductsService.update(id, dto);
  }

  @Patch(':id/approve')
  approve(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminProductsService.approve(id);
  }

  @Patch(':id/reject')
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectProductDto,
  ) {
    return this.adminProductsService.reject(id, dto.reason);
  }
}
