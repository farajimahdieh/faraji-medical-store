import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ProductsService } from '../catalog/products/products.service';
import { AiConversationService } from './ai-conversation.service';
import { AiMessageRole } from './entities/ai-message.entity';
import { AI_PROVIDER } from './providers/ai-provider.interface';
import type { AiProvider } from './providers/ai-provider.interface';
import {
  toAiChatMessage,
  toAiProductCandidate,
} from './product-candidate.mapper';
import { AI_SYSTEM_PROMPT } from './ai-system-prompt';
import { isOffTopicMessage, OFF_TOPIC_REPLY } from './off-topic.util';
import {
  getAiMaxHistoryMessages,
  getAiMaxOutputTokens,
  getAiMaxProductCandidates,
} from './ai.config';
import { PublicChatResponse } from './chat.public';

const MAX_SUGGESTED_PRODUCTS = 3;

export interface AnswerMessageInput {
  userId: string;
  conversationId?: string;
  message: string;
}

@Injectable()
export class AiService {
  constructor(
    private readonly conversationService: AiConversationService,
    private readonly productsService: ProductsService,
    @Inject(AI_PROVIDER) private readonly aiProvider: AiProvider,
    private readonly configService: ConfigService,
  ) {}

  async answerMessage(input: AnswerMessageInput): Promise<PublicChatResponse> {
    const conversation = await this.conversationService.getOrCreateConversation(
      input.userId,
      input.conversationId,
    );
    await this.conversationService.saveMessage({
      conversationId: conversation.id,
      role: AiMessageRole.USER,
      content: input.message,
    });

    if (isOffTopicMessage(input.message)) {
      await this.conversationService.saveMessage({
        conversationId: conversation.id,
        role: AiMessageRole.ASSISTANT,
        content: OFF_TOPIC_REPLY,
      });
      return {
        conversationId: conversation.id,
        message: OFF_TOPIC_REPLY,
        products: [],
        needsMoreInfo: false,
      };
    }

    const [history, candidates] = await Promise.all([
      this.conversationService.getRecentMessages(
        conversation.id,
        getAiMaxHistoryMessages(this.configService),
      ),
      this.productsService.searchForConsultation(
        input.message,
        getAiMaxProductCandidates(this.configService),
      ),
    ]);

    const providerResponse = await this.aiProvider.generateResponse({
      systemPrompt: AI_SYSTEM_PROMPT,
      messages: history.map(toAiChatMessage),
      products: candidates.map(toAiProductCandidate),
      maxOutputTokens: getAiMaxOutputTokens(this.configService),
    });

    // Never trust a provider's product ids as-is -- only ones that actually
    // came from our own candidate search may reach the client.
    const suggestedIds = new Set(providerResponse.suggestedProductIds);
    const matchedProducts = candidates
      .filter((product) => suggestedIds.has(product.id))
      .slice(0, MAX_SUGGESTED_PRODUCTS);

    await this.conversationService.saveMessage({
      conversationId: conversation.id,
      role: AiMessageRole.ASSISTANT,
      content: providerResponse.message,
    });

    return {
      conversationId: conversation.id,
      message: providerResponse.message,
      products: this.productsService.toPublicListItems(matchedProducts),
      needsMoreInfo: providerResponse.needsMoreInfo,
    };
  }
}
