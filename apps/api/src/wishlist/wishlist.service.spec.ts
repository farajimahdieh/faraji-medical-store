import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';

import { WishlistService } from './wishlist.service';
import { WishlistItem } from './entities/wishlist-item.entity';
import { Product, ProductStatus } from '../catalog/entities/product.entity';
import { ProductVariant } from '../catalog/entities/product-variant.entity';

function buildWishlistRepositoryMock() {
  return {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    count: jest.fn(),
    create: jest.fn((entity) => entity),
    save: jest.fn((entity) => Promise.resolve(entity)),
    delete: jest.fn(),
  };
}

function buildProductRepositoryMock() {
  return { findOne: jest.fn() };
}

function buildVariantRepositoryMock() {
  return { findOne: jest.fn() };
}

async function buildTestingService() {
  const wishlistRepository = buildWishlistRepositoryMock();
  const productRepository = buildProductRepositoryMock();
  const variantRepository = buildVariantRepositoryMock();

  const moduleRef = await Test.createTestingModule({
    providers: [
      WishlistService,
      {
        provide: getRepositoryToken(WishlistItem),
        useValue: wishlistRepository,
      },
      { provide: getRepositoryToken(Product), useValue: productRepository },
      {
        provide: getRepositoryToken(ProductVariant),
        useValue: variantRepository,
      },
    ],
  }).compile();

  return {
    service: moduleRef.get(WishlistService),
    wishlistRepository,
    productRepository,
    variantRepository,
  };
}

function buildProduct(overrides?: Partial<Product>): Product {
  return {
    id: 'product-1',
    status: ProductStatus.ACTIVE,
    ...overrides,
  } as Product;
}

function buildWishlistItem(overrides?: Partial<WishlistItem>): WishlistItem {
  return {
    id: 'item-1',
    userId: 'user-1',
    productId: 'product-1',
    variantId: null,
    note: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    product: {
      id: 'product-1',
      name: 'کمربند طبی',
      slug: 'lumbar-support-belt',
      images: [],
      brand: null,
    } as unknown as Product,
    variant: null,
    ...overrides,
  } as WishlistItem;
}

describe('WishlistService', () => {
  describe('add', () => {
    it('rejects when the product does not exist (or is not active)', async () => {
      const { service, productRepository } = await buildTestingService();
      productRepository.findOne.mockResolvedValue(null);

      await expect(
        service.add('user-1', { productId: 'missing' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects a variant that does not belong to the given product', async () => {
      const { service, productRepository, variantRepository } =
        await buildTestingService();
      productRepository.findOne.mockResolvedValue(buildProduct());
      variantRepository.findOne.mockResolvedValue(null);

      await expect(
        service.add('user-1', {
          productId: 'product-1',
          variantId: 'variant-of-another-product',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('returns the existing item instead of creating a duplicate', async () => {
      const { service, productRepository, wishlistRepository } =
        await buildTestingService();
      productRepository.findOne.mockResolvedValue(buildProduct());
      const existing = buildWishlistItem();
      wishlistRepository.findOne.mockResolvedValue(existing);

      const result = await service.add('user-1', { productId: 'product-1' });

      expect(result.wishlistItemId).toBe(existing.id);
      expect(wishlistRepository.save).not.toHaveBeenCalled();
    });

    it('creates a new item when none exists yet', async () => {
      const { service, productRepository, wishlistRepository } =
        await buildTestingService();
      productRepository.findOne.mockResolvedValue(buildProduct());
      wishlistRepository.findOne
        .mockResolvedValueOnce(null) // findOwnItem check
        .mockResolvedValueOnce(buildWishlistItem({ id: 'new-item' })); // reload after save

      const result = await service.add('user-1', { productId: 'product-1' });

      expect(wishlistRepository.save).toHaveBeenCalledTimes(1);
      expect(result.wishlistItemId).toBe('new-item');
    });

    it('recovers from a concurrent-insert unique-violation by returning the winning row', async () => {
      const { service, productRepository, wishlistRepository } =
        await buildTestingService();
      productRepository.findOne.mockResolvedValue(buildProduct());
      const winner = buildWishlistItem({ id: 'winner' });
      wishlistRepository.findOne
        .mockResolvedValueOnce(null) // findOwnItem check finds nothing
        .mockResolvedValueOnce(winner); // re-query after the race
      wishlistRepository.save.mockRejectedValueOnce(
        Object.assign(new Error('duplicate key'), { code: '23505' }),
      );

      const result = await service.add('user-1', { productId: 'product-1' });

      expect(result.wishlistItemId).toBe('winner');
    });

    it('rethrows unrelated save errors', async () => {
      const { service, productRepository, wishlistRepository } =
        await buildTestingService();
      productRepository.findOne.mockResolvedValue(buildProduct());
      wishlistRepository.findOne.mockResolvedValueOnce(null);
      wishlistRepository.save.mockRejectedValueOnce(new Error('boom'));

      await expect(
        service.add('user-1', { productId: 'product-1' }),
      ).rejects.toThrow('boom');
    });
  });

  describe('countForUser', () => {
    it('returns the count for the given user only', async () => {
      const { service, wishlistRepository } = await buildTestingService();
      wishlistRepository.count.mockResolvedValue(3);

      await expect(service.countForUser('user-1')).resolves.toEqual({
        count: 3,
      });
      expect(wishlistRepository.count).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });
  });

  describe('isInWishlist', () => {
    it('reports true with the item id when present', async () => {
      const { service, wishlistRepository } = await buildTestingService();
      wishlistRepository.findOne.mockResolvedValue(
        buildWishlistItem({ id: 'found' }),
      );

      await expect(
        service.isInWishlist('user-1', 'product-1', null),
      ).resolves.toEqual({ inWishlist: true, wishlistItemId: 'found' });
    });

    it('reports false when absent', async () => {
      const { service, wishlistRepository } = await buildTestingService();
      wishlistRepository.findOne.mockResolvedValue(null);

      await expect(
        service.isInWishlist('user-1', 'product-1', null),
      ).resolves.toEqual({ inWishlist: false, wishlistItemId: null });
    });
  });

  describe('updateNote', () => {
    it('rejects when the item does not belong to the user', async () => {
      const { service, wishlistRepository } = await buildTestingService();
      wishlistRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateNote('user-1', 'item-1', 'note'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('sets a note', async () => {
      const { service, wishlistRepository } = await buildTestingService();
      const item = buildWishlistItem();
      wishlistRepository.findOne
        .mockResolvedValueOnce(item)
        .mockResolvedValueOnce({ ...item, note: 'hello' });

      const result = await service.updateNote('user-1', 'item-1', 'hello');

      expect(item.note).toBe('hello');
      expect(result.note).toBe('hello');
    });

    it('treats an empty string as clearing the note', async () => {
      const { service, wishlistRepository } = await buildTestingService();
      const item = buildWishlistItem({ note: 'old note' });
      wishlistRepository.findOne
        .mockResolvedValueOnce(item)
        .mockResolvedValueOnce({ ...item, note: null });

      await service.updateNote('user-1', 'item-1', '');

      expect(item.note).toBeNull();
    });
  });

  describe('remove', () => {
    it('rejects when nothing was deleted (not found / not owned)', async () => {
      const { service, wishlistRepository } = await buildTestingService();
      wishlistRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove('user-1', 'item-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('deletes scoped to the owning user', async () => {
      const { service, wishlistRepository } = await buildTestingService();
      wishlistRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove('user-1', 'item-1');

      expect(wishlistRepository.delete).toHaveBeenCalledWith({
        id: 'item-1',
        userId: 'user-1',
      });
    });
  });
});
