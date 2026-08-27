import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';

import { CartService } from './cart.service';
import { Cart, CartStatus } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { ProductVariant } from '../catalog/entities/product-variant.entity';
import { Product, ProductStatus } from '../catalog/entities/product.entity';
import { DiscountCode } from '../coupons/entities/discount-code.entity';
import { CouponValidationService } from '../coupons/coupon-validation.service';
import { StorageService } from '../storage/storage.service';

function buildRepositoryMock() {
  return {
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    find: jest.fn(),
    create: jest.fn((entity) => entity),
    save: jest.fn((entity) => Promise.resolve(entity)),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

async function buildTestingService() {
  const cartRepository = buildRepositoryMock();
  const cartItemRepository = buildRepositoryMock();
  const variantRepository = buildRepositoryMock();
  const discountCodeRepository = buildRepositoryMock();
  const couponValidation = {
    previewByCode: jest.fn(),
    revalidate: jest.fn(),
    redeem: jest.fn(),
    computeDiscount: jest.fn(),
  };

  const moduleRef = await Test.createTestingModule({
    providers: [
      CartService,
      { provide: getRepositoryToken(Cart), useValue: cartRepository },
      { provide: getRepositoryToken(CartItem), useValue: cartItemRepository },
      { provide: getRepositoryToken(ProductVariant), useValue: variantRepository },
      { provide: getRepositoryToken(DiscountCode), useValue: discountCodeRepository },
      { provide: CouponValidationService, useValue: couponValidation },
      { provide: StorageService, useValue: { resolveUrl: jest.fn((key: string) => `https://cdn.test/${key}`) } },
    ],
  }).compile();

  return {
    service: moduleRef.get(CartService),
    cartRepository,
    cartItemRepository,
    variantRepository,
    discountCodeRepository,
    couponValidation,
  };
}

function buildCart(overrides?: Partial<Cart>): Cart {
  return {
    id: 'cart-1',
    userId: 'user-1',
    status: CartStatus.ACTIVE,
    appliedCouponId: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    items: [],
    ...overrides,
  } as Cart;
}

function buildProduct(overrides?: Partial<Product>): Product {
  return { id: 'product-1', name: 'گان جراحی', status: ProductStatus.ACTIVE, ...overrides } as Product;
}

function buildVariant(overrides?: Partial<ProductVariant>): ProductVariant {
  return {
    id: 'variant-1',
    productId: 'product-1',
    size: 'L',
    price: 100_000,
    stock: 5,
    isActive: true,
    ...overrides,
  } as ProductVariant;
}

describe('CartService', () => {
  describe('addItem', () => {
    it('creates a new cart item when none exists yet', async () => {
      const { service, cartRepository, cartItemRepository, variantRepository } =
        await buildTestingService();
      const variant = buildVariant();
      variantRepository.findOne.mockResolvedValue({ ...variant, product: buildProduct() });
      cartRepository.findOne.mockResolvedValue(buildCart());
      cartItemRepository.findOne.mockResolvedValueOnce(null); // existing-item lookup
      cartItemRepository.find.mockResolvedValue([]); // buildPublicCart refetch

      await service.addItem('user-1', { variantId: 'variant-1', quantity: 2 });

      expect(cartItemRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ cartId: 'cart-1', variantId: 'variant-1', quantity: 2 }),
      );
    });

    it('increments quantity when the variant is already in the cart', async () => {
      const { service, cartRepository, cartItemRepository, variantRepository } =
        await buildTestingService();
      variantRepository.findOne.mockResolvedValue({
        ...buildVariant(),
        product: buildProduct(),
      });
      cartRepository.findOne.mockResolvedValue(buildCart());
      const existing = { id: 'item-1', cartId: 'cart-1', variantId: 'variant-1', quantity: 1 };
      cartItemRepository.findOne.mockResolvedValueOnce(existing);
      cartItemRepository.find.mockResolvedValue([]);

      await service.addItem('user-1', { variantId: 'variant-1', quantity: 2 });

      expect(cartItemRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'item-1', quantity: 3 }),
      );
    });

    it('rejects when the product is hidden', async () => {
      const { service, variantRepository } = await buildTestingService();
      variantRepository.findOne.mockResolvedValue({
        ...buildVariant(),
        product: buildProduct({ status: ProductStatus.HIDDEN }),
      });

      await expect(
        service.addItem('user-1', { variantId: 'variant-1', quantity: 1 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects when the requested quantity exceeds stock', async () => {
      const { service, cartRepository, cartItemRepository, variantRepository } =
        await buildTestingService();
      variantRepository.findOne.mockResolvedValue({
        ...buildVariant({ stock: 3 }),
        product: buildProduct(),
      });
      cartRepository.findOne.mockResolvedValue(buildCart());
      cartItemRepository.findOne.mockResolvedValueOnce(null);

      await expect(
        service.addItem('user-1', { variantId: 'variant-1', quantity: 5 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('updateQuantity', () => {
    it('rejects when the item does not belong to the user cart', async () => {
      const { service, cartRepository, cartItemRepository } = await buildTestingService();
      cartRepository.findOne.mockResolvedValue(buildCart());
      cartItemRepository.findOne.mockResolvedValue(null);

      await expect(service.updateQuantity('user-1', 'item-1', 2)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('rejects a quantity above the current stock', async () => {
      const { service, cartRepository, cartItemRepository } = await buildTestingService();
      cartRepository.findOne.mockResolvedValue(buildCart());
      cartItemRepository.findOne.mockResolvedValue({
        id: 'item-1',
        cartId: 'cart-1',
        variant: buildVariant({ stock: 2 }),
      });

      await expect(service.updateQuantity('user-1', 'item-1', 3)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('removeItem', () => {
    it('rejects when nothing was deleted (not owned / not found)', async () => {
      const { service, cartRepository, cartItemRepository } = await buildTestingService();
      cartRepository.findOne.mockResolvedValue(buildCart());
      cartItemRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.removeItem('user-1', 'item-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('getSummaryForCheckout', () => {
    it('rejects an empty cart', async () => {
      const { service, cartRepository, cartItemRepository } = await buildTestingService();
      cartRepository.findOne.mockResolvedValue(buildCart());
      cartItemRepository.find.mockResolvedValue([]);

      await expect(service.getSummaryForCheckout('user-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects when a line item no longer has enough stock', async () => {
      const { service, cartRepository, cartItemRepository } = await buildTestingService();
      cartRepository.findOne.mockResolvedValue(buildCart());
      cartItemRepository.find.mockResolvedValue([
        {
          quantity: 10,
          product: buildProduct(),
          variant: buildVariant({ stock: 2 }),
        },
      ]);

      await expect(service.getSummaryForCheckout('user-1')).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('returns the live subtotal for a valid cart', async () => {
      const { service, cartRepository, cartItemRepository } = await buildTestingService();
      cartRepository.findOne.mockResolvedValue(buildCart());
      cartItemRepository.find.mockResolvedValue([
        { quantity: 2, product: buildProduct(), variant: buildVariant({ price: 50_000 }) },
      ]);

      const result = await service.getSummaryForCheckout('user-1');

      expect(result.subtotal).toBe(100_000);
    });
  });

  describe('applyCoupon', () => {
    it('stores the coupon id on the cart after a successful validation', async () => {
      const { service, cartRepository, cartItemRepository, couponValidation } =
        await buildTestingService();
      const cart = buildCart();
      cartRepository.findOne.mockResolvedValue(cart);
      cartItemRepository.find.mockResolvedValue([]);
      couponValidation.previewByCode.mockResolvedValue({
        coupon: { id: 'coupon-1' },
        discountAmount: 0,
      });

      await service.applyCoupon('user-1', 'SAVE10');

      expect(cartRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ appliedCouponId: 'coupon-1' }),
      );
    });

    it('propagates the validation error for an invalid coupon', async () => {
      const { service, cartRepository, cartItemRepository, couponValidation } =
        await buildTestingService();
      cartRepository.findOne.mockResolvedValue(buildCart());
      cartItemRepository.find.mockResolvedValue([]);
      couponValidation.previewByCode.mockRejectedValue(
        new BadRequestException('کد تخفیف نامعتبر است'),
      );

      await expect(service.applyCoupon('user-1', 'BAD')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });
});
