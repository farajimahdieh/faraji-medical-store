import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

import { AiService } from './ai.service';
import { ChatDto } from './dto/chat.dto';
import { SessionGuard } from '../auth/guards/session.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('ai')
@UseGuards(SessionGuard, ThrottlerGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  chat(@CurrentUser() user: User, @Body() dto: ChatDto) {
    return this.aiService.answerMessage({
      userId: user.id,
      conversationId: dto.conversationId,
      message: dto.message,
    });
  }
}
