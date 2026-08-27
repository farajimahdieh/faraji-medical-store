import { ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';

import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { ProductVariant } from '../catalog/entities/product-variant.entity';
import { UserAddress } from '../addresses/entities/user-address.entity';
import { DiscountCode } from '../coupons/entities/discount-code.entity';
import { CouponValidationService } from '../coupons/coupon-validation.service';
import { CartService } from '../cart/cart.service';
import { CartStatus } from '../cart/entities/cart.entity';
import { PAYMENT_PROVIDER } from '../payments/payment-provider.interface';

function buildQueryBuilderMock(affected = 1) {
  const qb: Record<string, jest.Mock> = {};
  qb.update = jest.fn(() => qb);
  qb.set = jest.fn(() => qb);
  qb.where = jest.fn(() => qb);
  qb.andWhere = jest.fn(() => qb);
  qb.setParameter = jest.fn(() => qb);
  qb.execute = jest.fn(() => Promise.resolve({ affected }));
  return qb;
}

function buildRepositoryMock() {
  const repo: Record<string, jest.Mock> & { manager?: unknown } = {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    find: jest.fn(),
    create: jest.fn((entity) => ({ id: 'order-1', ...entity })),
    save: jest.fn((entity) => Promise.resolve(entity)),
    createQueryBuilder: jest.fn(() => buildQueryBuilderMock(1)),
  };
  repo.manager = {
    transaction: jest.fn((callback: (manager: unknown) => unknown) =>
      callback({ withRepository: (r: unknown) => r }),
    ),
  };
  return repo;
}

async function buildTestingService() {
  const orderRepository = buildRepositoryMock();
  const orderItemRepository = buildRepositoryMock();
  const variantRepository = buildRepositoryMock();
  const addressRepository = buildRepositoryMock();
  const discountCodeRepository = buildRepositoryMock();
  const cartService = {
    getSummaryForCheckout: jest.fn(),
    markConverted: jest.fn(),
    addItem: jest.fn(),
  };
  const couponValidation = { revalidate: jest.fn(), redeem: jest.fn() };
  const paymentProvider = { charge: jest.fn().mockResolvedValue({ status: 'succeeded' }) };

  const moduleRef = await Test.createTestingModule({
    providers: [
      OrdersService,
      { provide: getRepositoryToken(Order), useValue: orderRepository },
      { provide: getRepositoryToken(OrderItem), useValue: orderItemRepository },
      { provide: getRepositoryToken(ProductVariant), useValue: variantRepository },
      { provide: getRepositoryToken(UserAddress), useValue: addressRepository },
      { provide: getRepositoryToken(DiscountCode), useValue: discountCodeRepository },
      { provide: CartService, useValue: cartService },
      { provide: CouponValidationService, useValue: couponValidation },
      { provide: PAYMENT_PROVIDER, useValue: paymentProvider },
    ],
  }).compile();

  return {
    service: moduleRef.get(OrdersService),
    orderRepository,
    orderItemRepository,
    variantRepository,
    addressRepository,
    discountCodeRepository,
    cartService,
    couponValidation,
    paymentProvider,
  };
}

function buildAddress(overrides?: Partial<UserAddress>): UserAddress {
  return {
    id: 'address-1',
    userId: 'user-1',
    recipientName: 'علی رضایی',
    recipientPhone: '+989123456789',
    province: 'تهران',
    city: 'تهران',
    addressLine: 'خیابان ولیعصر',
    postalCode: '1234567890',
    buildingNumber: null,
    unit: null,
    ...overrides,
  } as UserAddress;
}

function buildFullOrder(overrides?: Record<string, unknown>) {
  return {
    id: 'order-1',
    orderNumber: 'F-20260826-100000',
    status: 'paid',
    paymentStatus: 'paid',
    subtotal: 100_000,
    discountAmount: 0,
    shippingAmount: 0,
    taxAmount: 0,
    totalAmount: 100_000,
    shippingMethod: null,
    notes: null,
    shippingRecipientName: 'علی رضایی',
    shippingRecipientPhone: '+989123456789',
    shippingProvince: 'تهران',
    shippingCity: 'تهران',
    shippingAddressLine: 'خیابان ولیعصر',
    shippingPostalCode: '1234567890',
    shippingBuildingNumber: null,
    shippingUnit: null,
    createdAt: new Date('2026-01-01'),
    items: [],
    ...overrides,
  };
}

function buildCartItem(overrides?: Record<string, unknown>) {
  return {
    productId: 'product-1',
    variantId: 'variant-1',
    quantity: 2,
    product: { name: 'گان جراحی' },
    variant: { size: 'L', price: 50_000, stock: 5, isActive: true, accountingId: 'SKU-1' },
    ...overrides,
  };
}

describe('OrdersService', () => {
  describe('create', () => {
    it('rejects when the address does not belong to the user', async () => {
      const { service, addressRepository } = await buildTestingService();
      addressRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create('user-1', { addressId: 'address-1' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('creates an order with the live subtotal, decrements stock, and converts the cart', async () => {
      const { service, addressRepository, orderRepository, variantRepository, cartService } =
        await buildTestingService();
      addressRepository.findOne.mockResolvedValue(buildAddress());
      const item = buildCartItem();
      cartService.getSummaryForCheckout.mockResolvedValue({
        cart: { id: 'cart-1', appliedCouponId: null, status: CartStatus.ACTIVE },
        items: [item],
        subtotal: 100_000,
      });
      variantRepository.find.mockResolvedValue([
        { id: 'variant-1', price: 50_000, stock: 5, isActive: true, accountingId: 'SKU-1' },
      ]);
      orderRepository.findOne
        .mockResolvedValueOnce(null) // order-number uniqueness check
        .mockResolvedValueOnce(buildFullOrder()); // final re-fetch for the response

      await service.create('user-1', { addressId: 'address-1' });

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ subtotal: 100_000, discountAmount: 0, totalAmount: 100_000 }),
      );
      expect(cartService.markConverted).toHaveBeenCalledWith('cart-1', expect.anything());
    });

    it('applies a valid coupon to reduce the total and records the redemption', async () => {
      const { service, addressRepository, orderRepository, variantRepository, discountCodeRepository, cartService, couponValidation } =
        await buildTestingService();
      addressRepository.findOne.mockResolvedValue(buildAddress());
      cartService.getSummaryForCheckout.mockResolvedValue({
        cart: { id: 'cart-1', appliedCouponId: 'coupon-1', status: CartStatus.ACTIVE },
        items: [buildCartItem()],
        subtotal: 100_000,
      });
      variantRepository.find.mockResolvedValue([
        { id: 'variant-1', price: 50_000, stock: 5, isActive: true, accountingId: 'SKU-1' },
      ]);
      orderRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(buildFullOrder({ discountAmount: 10_000, totalAmount: 90_000 }));
      discountCodeRepository.findOne.mockResolvedValue({ id: 'coupon-1', code: 'SAVE10' });
      couponValidation.revalidate.mockResolvedValue({ discountAmount: 10_000 });

      await service.create('user-1', { addressId: 'address-1' });

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ discountAmount: 10_000, totalAmount: 90_000 }),
      );
      expect(couponValidation.redeem).toHaveBeenCalledWith(
        'coupon-1',
        'user-1',
        'order-1',
        100_000,
        expect.anything(),
      );
    });

    it('rejects when stock ran out between checkout validation and the transaction', async () => {
      const { service, addressRepository, orderRepository, variantRepository, cartService } =
        await buildTestingService();
      addressRepository.findOne.mockResolvedValue(buildAddress());
      cartService.getSummaryForCheckout.mockResolvedValue({
        cart: { id: 'cart-1', appliedCouponId: null, status: CartStatus.ACTIVE },
        items: [buildCartItem()],
        subtotal: 100_000,
      });
      variantRepository.find.mockResolvedValue([
        { id: 'variant-1', price: 50_000, stock: 5, isActive: true, accountingId: 'SKU-1' },
      ]);
      orderRepository.findOne.mockResolvedValue(null);
      variantRepository.createQueryBuilder.mockReturnValue(buildQueryBuilderMock(0));

      await expect(
        service.create('user-1', { addressId: 'address-1' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('findOneForUser', () => {
    it('rejects when the order does not belong to the user (no leaked existence)', async () => {
      const { service, orderRepository } = await buildTestingService();
      orderRepository.findOne.mockResolvedValue(null);

      await expect(service.findOneForUser('user-1', 'order-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('reorder', () => {
    it('re-adds available lines and reports the ones it could not', async () => {
      const { service, orderRepository, cartService } = await buildTestingService();
      orderRepository.findOne.mockResolvedValue({
        id: 'order-1',
        userId: 'user-1',
        items: [
          { productName: 'گان جراحی', variantId: 'variant-1', quantity: 2 },
          { productName: 'محصول حذف‌شده', variantId: null, quantity: 1 },
        ],
      });
      cartService.addItem.mockResolvedValueOnce({});

      const result = await service.reorder('user-1', 'order-1');

      expect(result.addedCount).toBe(1);
      expect(result.skipped).toEqual([
        { productName: 'محصول حذف‌شده', reason: 'این کالا دیگر در فروشگاه موجود نیست' },
      ]);
    });
  });
});
