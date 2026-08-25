import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { RecentlyViewedService } from './recently-viewed.service';
import { ListRecentlyViewedQueryDto } from './dto/list-recently-viewed-query.dto';
import { SessionGuard } from '../auth/guards/session.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('recently-viewed')
@UseGuards(SessionGuard)
export class RecentlyViewedController {
  constructor(private readonly recentlyViewedService: RecentlyViewedService) {}

  @Post(':productId')
  @HttpCode(204)
  recordView(
    @CurrentUser() user: User,
    @Param('productId', ParseUUIDPipe) productId: string,
  ): Promise<void> {
    return this.recentlyViewedService.recordView(user.id, productId);
  }

  @Get()
  list(@CurrentUser() user: User, @Query() query: ListRecentlyViewedQueryDto) {
    return this.recentlyViewedService.findRecentForUser(user.id, query.limit);
  }

  @Delete()
  @HttpCode(204)
  clear(@CurrentUser() user: User): Promise<void> {
    return this.recentlyViewedService.clearForUser(user.id);
  }
}
