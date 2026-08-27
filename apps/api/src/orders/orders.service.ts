import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Order, OrderStatus, PaymentStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { ProductVariant } from '../catalog/entities/product-variant.entity';
import { UserAddress } from '../addresses/entities/user-address.entity';
import { DiscountCode } from '../coupons/entities/discount-code.entity';
import { CouponValidationService } from '../coupons/coupon-validation.service';
import { CartService } from '../cart/cart.service';
import { PAYMENT_PROVIDER } from '../payments/payment-provider.interface';
import type { PaymentProvider } from '../payments/payment-provider.interface';
import { CreateOrderDto } from './dto/create-order.dto';
import {
  PublicOrderDetail,
  PublicOrderSummary,
  toPublicOrderDetail,
  toPublicOrderSummary,
} from './order.public';
import { generateOrderNumber } from './order-number.util';
import { StorageService } from '../storage/storage.service';

const DETAIL_RELATIONS = { items: { product: { images: true } } } as const;

export interface ReorderResult {
  addedCount: number;
  skipped: { productName: string; reason: string }[];
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,
    @InjectRepository(UserAddress)
    private readonly addressRepo: Repository<UserAddress>,
    @InjectRepository(DiscountCode)
    private readonly discountCodeRepo: Repository<DiscountCode>,
    private readonly cartService: CartService,
    private readonly couponValidation: CouponValidationService,
    @Inject(PAYMENT_PROVIDER)
    private readonly paymentProvider: PaymentProvider,
    private readonly storageService: StorageService,
  ) {}

  async create(userId: string, dto: CreateOrderDto): Promise<PublicOrderDetail> {
    const address = await this.addressRepo.findOne({
      where: { id: dto.addressId, userId },
    });
    if (!address) {
      throw new NotFoundException('آدرس مورد نظر یافت نشد');
    }

    // Validates the whole cart against live data and throws on any problem
    // (empty cart, hidden product, no price, insufficient stock) -- this
    // pass never mutates anything, the transaction below does.
    const { cart, items } = await this.cartService.getSummaryForCheckout(userId);

    const orderId = await this.orderRepo.manager.transaction(async (manager) => {
      const orderRepo = manager.withRepository(this.orderRepo);
      const orderItemRepo = manager.withRepository(this.orderItemRepo);
      const variantRepo = manager.withRepository(this.variantRepo);
      const discountCodeRepo = manager.withRepository(this.discountCodeRepo);

      // Re-read variants inside the transaction -- a moment may have passed
      // since getSummaryForCheckout, and price/active-status could have
      // changed. Stock itself is re-checked atomically at decrement time.
      const variantIds = items.map((item) => item.variantId);
      const freshVariants = await variantRepo.find({ where: { id: In(variantIds) } });
      const freshById = new Map(freshVariants.map((variant) => [variant.id, variant]));

      for (const item of items) {
        const fresh = freshById.get(item.variantId);
        if (!fresh || !fresh.isActive || fresh.price === null) {
          throw new ConflictException(`«${item.product.name}» دیگر موجود نیست`);
        }
      }

      const subtotal = items.reduce(
        (sum, item) => sum + freshById.get(item.variantId)!.price! * item.quantity,
        0,
      );

      let discountAmount = 0;
      if (cart.appliedCouponId) {
        const discountCode = await discountCodeRepo.findOne({
          where: { id: cart.appliedCouponId },
        });
        if (discountCode) {
          const preCheck = await this.couponValidation.revalidate(discountCode, userId, subtotal);
          discountAmount = preCheck.discountAmount;
        }
      }

      const totalAmount = Math.max(0, subtotal - discountAmount);
      const orderNumber = await this.generateUniqueOrderNumber(orderRepo);

      const order = await orderRepo.save(
        orderRepo.create({
          userId,
          orderNumber,
          shippingRecipientName: address.recipientName,
          shippingRecipientPhone: address.recipientPhone,
          shippingProvince: address.province,
          shippingCity: address.city,
          shippingAddressLine: address.addressLine,
          shippingPostalCode: address.postalCode,
          shippingBuildingNumber: address.buildingNumber,
          shippingUnit: address.unit,
          addressId: address.id,
          shippingMethod: dto.shippingMethod ?? null,
          notes: dto.notes ?? null,
          subtotal,
          discountAmount,
          discountCodeId: cart.appliedCouponId,
          totalAmount,
        }),
      );

      if (cart.appliedCouponId) {
        // Hard re-check (usage limit / per-user) + records the redemption --
        // can still reject here on a genuine race even though the soft
        // check above passed, rolling back the whole order.
        await this.couponValidation.redeem(
          cart.appliedCouponId,
          userId,
          order.id,
          subtotal,
          manager,
        );
      }

      await orderItemRepo.save(
        items.map((item) => {
          const fresh = freshById.get(item.variantId)!;
          return orderItemRepo.create({
            orderId: order.id,
            productId: item.productId,
            variantId: item.variantId,
            productName: item.product.name,
            variantSize: item.variant.size,
            sku: fresh.accountingId,
            unitPrice: fresh.price!,
            quantity: item.quantity,
            lineTotal: fresh.price! * item.quantity,
          });
        }),
      );

      for (const item of items) {
        const fresh = freshById.get(item.variantId)!;
        if (fresh.stock === null) continue; // "not yet synced" -- never limit on this
        const result = await variantRepo
          .createQueryBuilder()
          .update(ProductVariant)
          .set({ stock: () => '"stock" - :qty' })
          .where('id = :id', { id: item.variantId })
          .andWhere('stock >= :qty', { qty: item.quantity })
          .setParameter('qty', item.quantity)
          .execute();
        if (!result.affected) {
          throw new ConflictException(`موجودی «${item.product.name}» کافی نیست`);
        }
      }

      const charge = await this.paymentProvider.charge(order.id, totalAmount);
      order.paymentStatus = charge.status === 'succeeded' ? PaymentStatus.PAID : PaymentStatus.FAILED;
      order.status =
        charge.status === 'succeeded' ? OrderStatus.PAID : OrderStatus.PENDING_PAYMENT;
      await orderRepo.save(order);

      await this.cartService.markConverted(cart.id, manager);

      return order.id;
    });

    return this.findOneForUser(userId, orderId);
  }

  async findAllForUser(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ items: PublicOrderSummary[]; total: number; page: number; limit: number }> {
    const [orders, total] = await this.orderRepo.findAndCount({
      where: { userId },
      relations: { items: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items: orders.map(toPublicOrderSummary), total, page, limit };
  }

  async findOneForUser(userId: string, id: string): Promise<PublicOrderDetail> {
    const order = await this.orderRepo.findOne({
      where: { id, userId },
      relations: DETAIL_RELATIONS,
    });
    if (!order) {
      throw new NotFoundException('سفارش مورد نظر یافت نشد');
    }
    return toPublicOrderDetail(order, (key) => this.storageService.resolveUrl(key));
  }

  async reorder(userId: string, id: string): Promise<ReorderResult> {
    const order = await this.orderRepo.findOne({
      where: { id, userId },
      relations: { items: true },
    });
    if (!order) {
      throw new NotFoundException('سفارش مورد نظر یافت نشد');
    }

    let addedCount = 0;
    const skipped: { productName: string; reason: string }[] = [];

    for (const item of order.items) {
      if (!item.variantId) {
        skipped.push({ productName: item.productName, reason: 'این کالا دیگر در فروشگاه موجود نیست' });
        continue;
      }
      try {
        await this.cartService.addItem(userId, {
          variantId: item.variantId,
          quantity: item.quantity,
        });
        addedCount += 1;
      } catch (error) {
        const reason =
          error instanceof BadRequestException || error instanceof NotFoundException
            ? ((error.getResponse() as { message?: string }).message ?? 'امکان افزودن این کالا وجود ندارد')
            : 'امکان افزودن این کالا وجود ندارد';
        skipped.push({ productName: item.productName, reason });
      }
    }

    return { addedCount, skipped };
  }

  private async generateUniqueOrderNumber(orderRepo: Repository<Order>): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = generateOrderNumber();
      const exists = await orderRepo.findOne({ where: { orderNumber: candidate } });
      if (!exists) return candidate;
    }
    throw new ConflictException('امکان ایجاد شماره سفارش وجود ندارد، دوباره تلاش کنید');
  }
}
