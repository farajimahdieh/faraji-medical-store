import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AiConversation } from './entities/ai-conversation.entity';
import { AiMessage, AiMessageRole } from './entities/ai-message.entity';

@Injectable()
export class AiConversationService {
  constructor(
    @InjectRepository(AiConversation)
    private readonly conversationRepo: Repository<AiConversation>,
    @InjectRepository(AiMessage)
    private readonly messageRepo: Repository<AiMessage>,
  ) {}

  // A conversationId is only ever accepted back from the same user that
  // started it (scoped by userId), so a guessed/stolen id can't be used to
  // read or append to someone else's chat history.
  async getOrCreateConversation(
    userId: string,
    conversationId?: string,
  ): Promise<AiConversation> {
    if (!conversationId) {
      return this.conversationRepo.save(
        this.conversationRepo.create({ userId }),
      );
    }

    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId, userId },
    });
    if (!conversation) {
      throw new NotFoundException('گفتگو یافت نشد');
    }
    return conversation;
  }

  // Returned oldest-first, ready to feed straight into an AiProvider's
  // `messages` -- short-term memory only, capped by `limit` (see
  // ai.config.ts) so token usage never scales with a long-running chat.
  async getRecentMessages(
    conversationId: string,
    limit: number,
  ): Promise<AiMessage[]> {
    const messages = await this.messageRepo.find({
      where: { conversationId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return messages.reverse();
  }

  async saveMessage(input: {
    conversationId: string;
    role: AiMessageRole;
    content: string;
  }): Promise<AiMessage> {
    return this.messageRepo.save(this.messageRepo.create(input));
  }
}
