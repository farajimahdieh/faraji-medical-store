import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { AdminCouponsService } from './admin-coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { AdminOnly } from '../auth/decorators/admin-guards.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@AdminOnly()
@Controller('admin/coupons')
export class AdminCouponsController {
  constructor(private readonly adminCouponsService: AdminCouponsService) {}

  @Get()
  list() {
    return this.adminCouponsService.list();
  }

  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminCouponsService.getById(id);
  }

  @Post()
  create(@CurrentUser() currentUser: User, @Body() dto: CreateCouponDto) {
    return this.adminCouponsService.create(dto, currentUser.id);
  }

  @Patch(':id')
  update(
    @CurrentUser() currentUser: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCouponDto,
  ) {
    return this.adminCouponsService.update(id, dto, currentUser.id);
  }
}
