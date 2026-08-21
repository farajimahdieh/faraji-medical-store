import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { WishlistService } from './wishlist.service';
import { AddWishlistItemDto } from './dto/add-wishlist-item.dto';
import { UpdateWishlistNoteDto } from './dto/update-wishlist-note.dto';
import { ListWishlistQueryDto } from './dto/list-wishlist-query.dto';
import { CheckWishlistQueryDto } from './dto/check-wishlist-query.dto';
import { SessionGuard } from '../auth/guards/session.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('wishlist')
@UseGuards(SessionGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post()
  add(@CurrentUser() user: User, @Body() dto: AddWishlistItemDto) {
    return this.wishlistService.add(user.id, dto);
  }

  @Get()
  list(@CurrentUser() user: User, @Query() query: ListWishlistQueryDto) {
    return this.wishlistService.findAllForUser(
      user.id,
      query.page,
      query.limit,
    );
  }

  @Get('count')
  count(@CurrentUser() user: User) {
    return this.wishlistService.countForUser(user.id);
  }

  @Get('check')
  check(@CurrentUser() user: User, @Query() query: CheckWishlistQueryDto) {
    return this.wishlistService.isInWishlist(
      user.id,
      query.productId,
      query.variantId ?? null,
    );
  }

  @Patch(':id')
  updateNote(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWishlistNoteDto,
  ) {
    return this.wishlistService.updateNote(user.id, id, dto.note ?? null);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.wishlistService.remove(user.id, id);
  }
}
