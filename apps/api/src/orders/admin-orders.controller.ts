import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';

import { AdminOrdersService } from './admin-orders.service';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { AdminOnly } from '../auth/decorators/admin-guards.decorator';

@AdminOnly()
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly adminOrdersService: AdminOrdersService) {}

  @Get()
  list(@Query() query: ListOrdersQueryDto) {
    return this.adminOrdersService.findAll(query.page, query.limit);
  }

  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminOrdersService.findOne(id);
  }
}
