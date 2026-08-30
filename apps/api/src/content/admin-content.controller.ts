import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ContentService } from './content.service';
import { UpdateContentDto } from './dto/update-content.dto';
import { AdminOnly } from '../auth/decorators/admin-guards.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@AdminOnly()
@Controller('admin/content')
export class AdminContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  list() {
    return this.contentService.list();
  }

  @Get(':key')
  getOne(@Param('key') key: string) {
    return this.contentService.getByKey(key);
  }

  @Patch(':key')
  update(
    @CurrentUser() currentUser: User,
    @Param('key') key: string,
    @Body() dto: UpdateContentDto,
  ) {
    return this.contentService.update(key, dto, currentUser.id);
  }
}
