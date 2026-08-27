import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { AdminsService } from './admins.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { SetAdminRoleDto } from './dto/set-admin-role.dto';
import { SuperAdminOnly } from '../auth/decorators/admin-guards.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@SuperAdminOnly()
@Controller('admin/admins')
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  @Post()
  create(@CurrentUser() currentUser: User, @Body() dto: CreateAdminDto) {
    return this.adminsService.create(dto, currentUser.id);
  }

  @Get()
  list() {
    return this.adminsService.list();
  }

  @Patch(':id/disable')
  disable(
    @CurrentUser() currentUser: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    this.assertNotSelf(currentUser, id);
    return this.adminsService.setActive(id, false);
  }

  @Patch(':id/enable')
  enable(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminsService.setActive(id, true);
  }

  @Patch(':id/role')
  setRole(
    @CurrentUser() currentUser: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetAdminRoleDto,
  ) {
    this.assertNotSelf(currentUser, id);
    return this.adminsService.setRole(id, dto.role);
  }

  // A super_admin disabling or demoting their own account would lock
  // everyone out with no path back short of direct DB access.
  private assertNotSelf(currentUser: User, targetId: string): void {
    if (currentUser.id === targetId) {
      throw new ForbiddenException(
        'نمی‌توانید این عملیات را روی حساب خودتان انجام دهید',
      );
    }
  }
}
