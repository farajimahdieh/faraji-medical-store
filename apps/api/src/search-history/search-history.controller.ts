import {
  Body,
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

import { SearchHistoryService } from './search-history.service';
import { CreateSearchHistoryDto } from './dto/create-search-history.dto';
import { ListSearchHistoryQueryDto } from './dto/list-search-history-query.dto';
import { SessionGuard } from '../auth/guards/session.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('search-history')
@UseGuards(SessionGuard)
export class SearchHistoryController {
  constructor(private readonly searchHistoryService: SearchHistoryService) {}

  @Post()
  add(@CurrentUser() user: User, @Body() dto: CreateSearchHistoryDto) {
    return this.searchHistoryService.recordSearch(user.id, dto.query);
  }

  @Get()
  list(@CurrentUser() user: User, @Query() query: ListSearchHistoryQueryDto) {
    return this.searchHistoryService.findRecentForUser(user.id, query.limit);
  }

  @Delete(':id')
  @HttpCode(204)
  removeOne(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.searchHistoryService.removeOne(user.id, id);
  }

  @Delete()
  @HttpCode(204)
  clear(@CurrentUser() user: User) {
    return this.searchHistoryService.clearForUser(user.id);
  }
}
