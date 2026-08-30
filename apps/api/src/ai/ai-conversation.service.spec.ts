import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';

import { AiConversationService } from './ai-conversation.service';
import { AiConversation } from './entities/ai-conversation.entity';
import { AiMessage, AiMessageRole } from './entities/ai-message.entity';

function buildRepoMock() {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn((entity) => entity),
    save: jest.fn((entity) =>
      Promise.resolve({ id: 'generated-id', ...entity }),
    ),
  };
}

async function buildTestingService() {
  const conversationRepo = buildRepoMock();
  const messageRepo = buildRepoMock();

  const moduleRef = await Test.createTestingModule({
    providers: [
      AiConversationService,
      {
        provide: getRepositoryToken(AiConversation),
        useValue: conversationRepo,
      },
      { provide: getRepositoryToken(AiMessage), useValue: messageRepo },
    ],
  }).compile();

  return {
    service: moduleRef.get(AiConversationService),
    conversationRepo,
    messageRepo,
  };
}

describe('AiConversationService', () => {
  it('creates a new conversation when no conversationId is given', async () => {
    const { service, conversationRepo } = await buildTestingService();

    const conversation = await service.getOrCreateConversation('user-1');

    expect(conversationRepo.create).toHaveBeenCalledWith({ userId: 'user-1' });
    expect(conversation.id).toBe('generated-id');
  });

  it('rejects a conversationId that does not belong to the user', async () => {
    const { service, conversationRepo } = await buildTestingService();
    conversationRepo.findOne.mockResolvedValue(null);

    await expect(
      service.getOrCreateConversation('user-1', 'someone-elses-conversation'),
    ).rejects.toThrow(NotFoundException);
  });

  it('returns recent messages oldest-first', async () => {
    const { service, messageRepo } = await buildTestingService();
    messageRepo.find.mockResolvedValue([
      { id: '2', content: 'second' },
      { id: '1', content: 'first' },
    ]);

    const messages = await service.getRecentMessages('conv-1', 8);

    expect(messageRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { conversationId: 'conv-1' }, take: 8 }),
    );
    expect(messages.map((m) => m.id)).toEqual(['1', '2']);
  });

  it('saves a message with the given role and content', async () => {
    const { service, messageRepo } = await buildTestingService();

    await service.saveMessage({
      conversationId: 'conv-1',
      role: AiMessageRole.USER,
      content: 'سلام',
    });

    expect(messageRepo.create).toHaveBeenCalledWith({
      conversationId: 'conv-1',
      role: AiMessageRole.USER,
      content: 'سلام',
    });
  });
});
