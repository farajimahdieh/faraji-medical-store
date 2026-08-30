import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { AiService } from './ai.service';
import { AiConversationService } from './ai-conversation.service';
import { ProductsService } from '../catalog/products/products.service';
import { AI_PROVIDER } from './providers/ai-provider.interface';
import { AiMessageRole } from './entities/ai-message.entity';

function buildProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: 'p1',
    name: 'بالش طبی گردن',
    shortDescription: 'بالش ارتوپدی',
    description: 'توضیحات کامل محصول',
    category: { name: 'گردن و شانه' },
    brand: { name: 'برند نمونه' },
    variants: [{ size: 'یک‌سایز', price: 500000, stock: 3, isActive: true }],
    ...overrides,
  };
}

async function buildTestingService() {
  const conversationService = {
    getOrCreateConversation: jest
      .fn()
      .mockResolvedValue({ id: 'conv-1', userId: 'user-1' }),
    getRecentMessages: jest.fn().mockResolvedValue([]),
    saveMessage: jest.fn().mockResolvedValue(undefined),
  };

  const productsService = {
    searchForConsultation: jest.fn().mockResolvedValue([]),
    toPublicListItems: jest.fn((products: unknown[]) => products),
  };

  const aiProvider = {
    generateResponse: jest.fn(),
  };

  const configService = {
    get: jest.fn((_key: string, fallback?: string) => fallback),
  };

  const moduleRef = await Test.createTestingModule({
    providers: [
      AiService,
      { provide: AiConversationService, useValue: conversationService },
      { provide: ProductsService, useValue: productsService },
      { provide: AI_PROVIDER, useValue: aiProvider },
      { provide: ConfigService, useValue: configService },
    ],
  }).compile();

  return {
    service: moduleRef.get(AiService),
    conversationService,
    productsService,
    aiProvider,
  };
}

describe('AiService.answerMessage', () => {
  it('short-circuits off-topic messages without calling the product search or the AI provider', async () => {
    const { service, conversationService, productsService, aiProvider } =
      await buildTestingService();

    const result = await service.answerMessage({
      userId: 'user-1',
      message: 'حاصل 2 + 2 چند میشه؟',
    });

    expect(productsService.searchForConsultation).not.toHaveBeenCalled();
    expect(aiProvider.generateResponse).not.toHaveBeenCalled();
    expect(result.products).toEqual([]);
    expect(result.needsMoreInfo).toBe(false);
    expect(conversationService.saveMessage).toHaveBeenCalledWith(
      expect.objectContaining({ role: AiMessageRole.USER }),
    );
    expect(conversationService.saveMessage).toHaveBeenCalledWith(
      expect.objectContaining({ role: AiMessageRole.ASSISTANT }),
    );
  });

  it('reuses the existing product search and returns only real, matched products', async () => {
    const { service, productsService, aiProvider } =
      await buildTestingService();
    const products = [buildProduct({ id: 'p1' }), buildProduct({ id: 'p2' })];
    productsService.searchForConsultation.mockResolvedValue(products);
    aiProvider.generateResponse.mockResolvedValue({
      message: 'این محصول مناسب است',
      // p2 is real, "fake-id" is not in the candidate list and must be dropped.
      suggestedProductIds: ['p2', 'fake-id'],
      needsMoreInfo: false,
    });

    const result = await service.answerMessage({
      userId: 'user-1',
      message: 'گردنم درد میکند',
    });

    expect(productsService.searchForConsultation).toHaveBeenCalledWith(
      'گردنم درد میکند',
      6,
    );
    expect(result.products).toEqual([products[1]]);
    expect(result.message).toBe('این محصول مناسب است');
  });

  it('asks a clarifying question and returns no products when the provider needs more info', async () => {
    const { service, aiProvider } = await buildTestingService();
    aiProvider.generateResponse.mockResolvedValue({
      message: 'برای چه کسی می‌خواهید؟',
      suggestedProductIds: [],
      needsMoreInfo: true,
    });

    const result = await service.answerMessage({
      userId: 'user-1',
      message: 'یک محصول میخوام',
    });

    expect(result.needsMoreInfo).toBe(true);
    expect(result.products).toEqual([]);
  });

  it('reuses an existing conversation when conversationId is provided', async () => {
    const { service, conversationService, aiProvider } =
      await buildTestingService();
    aiProvider.generateResponse.mockResolvedValue({
      message: 'باشه',
      suggestedProductIds: [],
      needsMoreInfo: true,
    });

    await service.answerMessage({
      userId: 'user-1',
      conversationId: 'conv-1',
      message: 'ادامه گفتگو',
    });

    expect(conversationService.getOrCreateConversation).toHaveBeenCalledWith(
      'user-1',
      'conv-1',
    );
  });
});
