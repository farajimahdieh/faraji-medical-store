import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';

import { RecentlyViewedService } from './recently-viewed.service';
import { RecentlyViewedProduct } from './entities/recently-viewed-product.entity';
import { Product, ProductStatus } from '../catalog/entities/product.entity';

function buildQueryBuilderMock(result: unknown[] = []) {
  const qb: Record<string, jest.Mock> = {};
  const chain = [
    'innerJoinAndSelect',
    'leftJoinAndSelect',
    'select',
    'where',
    'andWhere',
    'orderBy',
    'skip',
    'take',
  ];
  for (const method of chain) {
    qb[method] = jest.fn(() => qb);
  }
  qb.getMany = jest.fn().mockResolvedValue(result);
  qb.getRawMany = jest.fn().mockResolvedValue(result);
  return qb;
}

function buildRecentlyViewedRepositoryMock() {
  return {
    findOne: jest.fn(),
    create: jest.fn((entity) => entity),
    save: jest.fn((entity) => Promise.resolve(entity)),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => buildQueryBuilderMock()),
  };
}

function buildProductRepositoryMock() {
  return { findOne: jest.fn() };
}

async function buildTestingService() {
  const recentlyViewedRepository = buildRecentlyViewedRepositoryMock();
  const productRepository = buildProductRepositoryMock();

  const moduleRef = await Test.createTestingModule({
    providers: [
      RecentlyViewedService,
      {
        provide: getRepositoryToken(RecentlyViewedProduct),
        useValue: recentlyViewedRepository,
      },
      { provide: getRepositoryToken(Product), useValue: productRepository },
    ],
  }).compile();

  return {
    service: moduleRef.get(RecentlyViewedService),
    recentlyViewedRepository,
    productRepository,
  };
}

function buildProduct(overrides?: Partial<Product>): Product {
  return {
    id: 'product-1',
    status: ProductStatus.ACTIVE,
    ...overrides,
  } as Product;
}

describe('RecentlyViewedService', () => {
  describe('recordView', () => {
    it('rejects when the product does not exist (or is not active)', async () => {
      const { service, productRepository } = await buildTestingService();
      productRepository.findOne.mockResolvedValue(null);

      await expect(
        service.recordView('user-1', 'missing'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('creates a new row when none exists yet', async () => {
      const { service, productRepository, recentlyViewedRepository } =
        await buildTestingService();
      productRepository.findOne.mockResolvedValue(buildProduct());
      recentlyViewedRepository.findOne.mockResolvedValue(null);
      recentlyViewedRepository.createQueryBuilder.mockReturnValue(
        buildQueryBuilderMock([]),
      );

      await service.recordView('user-1', 'product-1');

      expect(recentlyViewedRepository.save).toHaveBeenCalledTimes(1);
      expect(recentlyViewedRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1', productId: 'product-1' }),
      );
    });

    it('updates viewedAt on an existing row instead of creating a duplicate', async () => {
      const { service, productRepository, recentlyViewedRepository } =
        await buildTestingService();
      productRepository.findOne.mockResolvedValue(buildProduct());
      const existing = {
        id: 'rv-1',
        userId: 'user-1',
        productId: 'product-1',
        viewedAt: new Date('2020-01-01'),
      };
      recentlyViewedRepository.findOne.mockResolvedValue(existing);
      recentlyViewedRepository.createQueryBuilder.mockReturnValue(
        buildQueryBuilderMock([]),
      );

      await service.recordView('user-1', 'product-1');

      expect(recentlyViewedRepository.create).not.toHaveBeenCalled();
      expect(recentlyViewedRepository.save).toHaveBeenCalledWith(existing);
      expect(existing.viewedAt.getTime()).toBeGreaterThan(
        new Date('2020-01-01').getTime(),
      );
    });

    it('trims older rows beyond the per-user cap after a write', async () => {
      const { service, productRepository, recentlyViewedRepository } =
        await buildTestingService();
      productRepository.findOne.mockResolvedValue(buildProduct());
      recentlyViewedRepository.findOne.mockResolvedValue(null);
      const trimQb = buildQueryBuilderMock([{ id: 'old-1' }, { id: 'old-2' }]);
      recentlyViewedRepository.createQueryBuilder.mockReturnValue(trimQb);

      await service.recordView('user-1', 'product-1');

      expect(recentlyViewedRepository.delete).toHaveBeenCalledWith([
        'old-1',
        'old-2',
      ]);
    });
  });

  describe('findRecentForUser', () => {
    it('scopes the query to the given user and active products only', async () => {
      const { service, recentlyViewedRepository } = await buildTestingService();
      const qb = buildQueryBuilderMock([]);
      recentlyViewedRepository.createQueryBuilder.mockReturnValue(qb);

      await service.findRecentForUser('user-1', 10);

      expect(qb.where).toHaveBeenCalledWith('rv.userId = :userId', {
        userId: 'user-1',
      });
      expect(qb.andWhere).toHaveBeenCalledWith('product.status = :status', {
        status: ProductStatus.ACTIVE,
      });
    });
  });

  describe('clearForUser', () => {
    it('deletes scoped to the owning user', async () => {
      const { service, recentlyViewedRepository } = await buildTestingService();

      await service.clearForUser('user-1');

      expect(recentlyViewedRepository.delete).toHaveBeenCalledWith({
        userId: 'user-1',
      });
    });
  });
});
