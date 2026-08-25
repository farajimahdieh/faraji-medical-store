import { Controller, Get, UseGuards } from '@nestjs/common';

import { CouponsService } from './coupons.service';
import { SessionGuard } from '../auth/guards/session.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('coupons')
@UseGuards(SessionGuard)
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  // Deliberately "/mine", not "GET /coupons" -- leaves that path free for a
  // future admin "list all coupons" endpoint without a path collision.
  @Get('mine')
  listMine(@CurrentUser() user: User) {
    return this.couponsService.findAvailableForUser(user.id);
  }
}
