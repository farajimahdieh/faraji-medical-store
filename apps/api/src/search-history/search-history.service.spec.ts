import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';

import { SearchHistoryService } from './search-history.service';
import { UserSearchHistory } from './entities/user-search-history.entity';

function buildQueryBuilderMock(result: unknown[] = []) {
  const qb: Record<string, jest.Mock> = {};
  for (const method of ['select', 'where', 'orderBy', 'skip']) {
    qb[method] = jest.fn(() => qb);
  }
  qb.getRawMany = jest.fn().mockResolvedValue(result);
  return qb;
}

function buildHistoryRepositoryMock() {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn((entity) => entity),
    save: jest.fn((entity) => Promise.resolve(entity)),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => buildQueryBuilderMock()),
  };
}

async function buildTestingService() {
  const historyRepository = buildHistoryRepositoryMock();

  const moduleRef = await Test.createTestingModule({
    providers: [
      SearchHistoryService,
      {
        provide: getRepositoryToken(UserSearchHistory),
        useValue: historyRepository,
      },
    ],
  }).compile();

  return { service: moduleRef.get(SearchHistoryService), historyRepository };
}

describe('SearchHistoryService', () => {
  describe('recordSearch', () => {
    it('rejects an empty (or whitespace-only) query', async () => {
      const { service } = await buildTestingService();

      await expect(
        service.recordSearch('user-1', '   '),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('creates a new row when no similar query exists', async () => {
      const { service, historyRepository } = await buildTestingService();
      historyRepository.findOne.mockResolvedValue(null);

      const result = await service.recordSearch('user-1', 'زانوبند');

      expect(historyRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1', query: 'زانوبند' }),
      );
      expect(result.query).toBe('زانوبند');
    });

    it('updates searchedAt for a normalization-equivalent query instead of duplicating', async () => {
      const { service, historyRepository } = await buildTestingService();
      const existing = {
        id: 'h-1',
        userId: 'user-1',
        query: 'زانو بند',
        normalizedQuery: 'زانو بند',
        searchedAt: new Date('2020-01-01'),
      };
      // "ي" (Arabic yeh) normalizes to "ی" (Persian yeh) -- same query.
      historyRepository.findOne.mockResolvedValue(existing);

      await service.recordSearch('user-1', 'زانو بند');

      expect(historyRepository.create).not.toHaveBeenCalled();
      expect(historyRepository.save).toHaveBeenCalledWith(existing);
      expect(existing.searchedAt.getTime()).toBeGreaterThan(
        new Date('2020-01-01').getTime(),
      );
    });

    it('trims older rows beyond the per-user cap after a write', async () => {
      const { service, historyRepository } = await buildTestingService();
      historyRepository.findOne.mockResolvedValue(null);
      const trimQb = buildQueryBuilderMock([{ id: 'old-1' }]);
      historyRepository.createQueryBuilder.mockReturnValue(trimQb);

      await service.recordSearch('user-1', 'گان بیمار');

      expect(historyRepository.delete).toHaveBeenCalledWith(['old-1']);
    });
  });

  describe('findRecentForUser', () => {
    it('scopes the query to the given user', async () => {
      const { service, historyRepository } = await buildTestingService();
      historyRepository.find.mockResolvedValue([]);

      await service.findRecentForUser('user-1', 10);

      expect(historyRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { searchedAt: 'DESC' },
        take: 10,
      });
    });
  });

  describe('removeOne', () => {
    it('rejects when the item does not belong to the user', async () => {
      const { service, historyRepository } = await buildTestingService();
      historyRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.removeOne('user-1', 'h-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('deletes scoped to the owning user', async () => {
      const { service, historyRepository } = await buildTestingService();
      historyRepository.delete.mockResolvedValue({ affected: 1 });

      await service.removeOne('user-1', 'h-1');

      expect(historyRepository.delete).toHaveBeenCalledWith({
        id: 'h-1',
        userId: 'user-1',
      });
    });
  });

  describe('clearForUser', () => {
    it('deletes scoped to the owning user', async () => {
      const { service, historyRepository } = await buildTestingService();

      await service.clearForUser('user-1');

      expect(historyRepository.delete).toHaveBeenCalledWith({
        userId: 'user-1',
      });
    });
  });
});
