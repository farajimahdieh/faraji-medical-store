import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, type EntityManager } from 'typeorm';

import { Cart, CartStatus } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { ProductVariant } from '../catalog/entities/product-variant.entity';
import { ProductStatus } from '../catalog/entities/product.entity';
import { UserRole } from '../users/entities/user.entity';
import { DiscountCode } from '../coupons/entities/discount-code.entity';
import { CouponValidationService } from '../coupons/coupon-validation.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import {
  PublicCart,
  toPublicCartCoupon,
  toPublicCartItem,
} from './cart.public';
import { StorageService } from '../storage/storage.service';

// Postgres error code for a unique-constraint violation.
const UNIQUE_VIOLATION = '23505';

const ITEM_RELATIONS = {
  product: { images: true, brand: true },
  variant: true,
} as const;

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepo: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepo: Repository<CartItem>,
    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,
    @InjectRepository(DiscountCode)
    private readonly discountCodeRepo: Repository<DiscountCode>,
    private readonly couponValidation: CouponValidationService,
    private readonly storageService: StorageService,
  ) {}

  async getCart(userId: string): Promise<PublicCart> {
    const cart = await this.getOrCreateActiveCart(userId);
    return this.buildPublicCart(cart, userId);
  }

  async addItem(userId: string, dto: AddCartItemDto): Promise<PublicCart> {
    const variant = await this.variantRepo.findOne({
      where: { id: dto.variantId },
      relations: { product: true },
    });
    if (
      !variant ||
      !variant.product ||
      variant.product.status !== ProductStatus.ACTIVE
    ) {
      throw new NotFoundException('محصول یافت نشد');
    }

    const cart = await this.getOrCreateActiveCart(userId);
    const existing = await this.cartItemRepo.findOne({
      where: { cartId: cart.id, variantId: variant.id },
    });
    const desiredQuantity = (existing?.quantity ?? 0) + dto.quantity;
    this.assertStock(variant, desiredQuantity);

    if (existing) {
      existing.quantity = desiredQuantity;
      await this.cartItemRepo.save(existing);
    } else {
      const item = this.cartItemRepo.create({
        cartId: cart.id,
        productId: variant.productId,
        variantId: variant.id,
        quantity: dto.quantity,
      });
      try {
        await this.cartItemRepo.save(item);
      } catch (error) {
        // Two near-simultaneous "add" requests can both miss the findOne
        // check above -- on a race, just bump the row that actually won.
        if (!this.isUniqueViolation(error)) throw error;
        const raced = await this.cartItemRepo.findOneOrFail({
          where: { cartId: cart.id, variantId: variant.id },
        });
        raced.quantity += dto.quantity;
        await this.cartItemRepo.save(raced);
      }
    }

    return this.buildPublicCart(cart, userId);
  }

  async updateQuantity(
    userId: string,
    itemId: string,
    quantity: number,
  ): Promise<PublicCart> {
    const cart = await this.getOrCreateActiveCart(userId);
    const item = await this.cartItemRepo.findOne({
      where: { id: itemId, cartId: cart.id },
      relations: { variant: true },
    });
    if (!item) {
      throw new NotFoundException('این کالا در سبد خرید شما یافت نشد');
    }

    this.assertStock(item.variant, quantity);
    item.quantity = quantity;
    await this.cartItemRepo.save(item);
    return this.buildPublicCart(cart, userId);
  }

  async removeItem(userId: string, itemId: string): Promise<PublicCart> {
    const cart = await this.getOrCreateActiveCart(userId);
    const result = await this.cartItemRepo.delete({
      id: itemId,
      cartId: cart.id,
    });
    if (result.affected === 0) {
      throw new NotFoundException('این کالا در سبد خرید شما یافت نشد');
    }
    return this.buildPublicCart(cart, userId);
  }

  async clearCart(userId: string): Promise<PublicCart> {
    const cart = await this.getOrCreateActiveCart(userId);
    await this.cartItemRepo.delete({ cartId: cart.id });
    if (cart.appliedCouponId) {
      cart.appliedCouponId = null;
      await this.cartRepo.save(cart);
    }
    return this.buildPublicCart(cart, userId);
  }

  async applyCoupon(
    userId: string,
    code: string,
    role?: UserRole,
  ): Promise<PublicCart> {
    const cart = await this.getOrCreateActiveCart(userId);
    const items = await this.loadItemsWithRelations(cart.id);
    const subtotal = this.computeSubtotal(items);

    const { coupon } = await this.couponValidation.previewByCode(
      code,
      userId,
      subtotal,
      role,
    );
    cart.appliedCouponId = coupon.id;
    await this.cartRepo.save(cart);
    return this.buildPublicCart(cart, userId, items);
  }

  async removeCoupon(userId: string): Promise<PublicCart> {
    const cart = await this.getOrCreateActiveCart(userId);
    cart.appliedCouponId = null;
    await this.cartRepo.save(cart);
    return this.buildPublicCart(cart, userId);
  }

  // Used by OrdersService.create -- re-validates every line against live
  // data and throws (rather than silently dropping) on any problem, so
  // checkout never proceeds on stale cart contents.
  async getSummaryForCheckout(userId: string): Promise<{
    cart: Cart;
    items: CartItem[];
    subtotal: number;
  }> {
    const cart = await this.getOrCreateActiveCart(userId);
    const items = await this.loadItemsWithRelations(cart.id);
    if (items.length === 0) {
      throw new BadRequestException('سبد خرید شما خالی است');
    }

    for (const item of items) {
      const { product, variant } = item;
      if (product.status !== ProductStatus.ACTIVE || !variant.isActive) {
        throw new ConflictException(`«${product.name}» دیگر موجود نیست`);
      }
      if (variant.price === null) {
        throw new ConflictException(
          `قیمت «${product.name}» هنوز مشخص نشده است`,
        );
      }
      if (variant.stock !== null && variant.stock < item.quantity) {
        throw new ConflictException(
          `موجودی «${product.name}» کافی نیست (${variant.stock} عدد باقی مانده)`,
        );
      }
    }

    return { cart, items, subtotal: this.computeSubtotal(items) };
  }

  // Empties the cart and flips it to CONVERTED inside the checkout
  // transaction -- the next add-to-cart lazily creates a fresh active one.
  async markConverted(cartId: string, manager: EntityManager): Promise<void> {
    const cartRepo = manager.withRepository(this.cartRepo);
    const itemRepo = manager.withRepository(this.cartItemRepo);
    await itemRepo.delete({ cartId });
    await cartRepo.update(
      { id: cartId },
      { status: CartStatus.CONVERTED, appliedCouponId: null },
    );
  }

  private async getOrCreateActiveCart(userId: string): Promise<Cart> {
    const existing = await this.cartRepo.findOne({
      where: { userId, status: CartStatus.ACTIVE },
    });
    if (existing) return existing;

    const cart = this.cartRepo.create({ userId, status: CartStatus.ACTIVE });
    try {
      await this.cartRepo.save(cart);
      return cart;
    } catch (error) {
      if (!this.isUniqueViolation(error)) throw error;
      return this.cartRepo.findOneOrFail({
        where: { userId, status: CartStatus.ACTIVE },
      });
    }
  }

  private loadItemsWithRelations(cartId: string): Promise<CartItem[]> {
    return this.cartItemRepo.find({
      where: { cartId },
      relations: ITEM_RELATIONS,
      order: { createdAt: 'ASC' },
    });
  }

  private computeSubtotal(items: CartItem[]): number {
    return items.reduce(
      (sum, item) => sum + (item.variant.price ?? 0) * item.quantity,
      0,
    );
  }

  private assertStock(variant: ProductVariant, desiredQuantity: number): void {
    if (!variant.isActive) {
      throw new BadRequestException('این کالا دیگر موجود نیست');
    }
    if (variant.stock !== null && desiredQuantity > variant.stock) {
      throw new BadRequestException(
        `موجودی کافی نیست (${variant.stock} عدد موجود است)`,
      );
    }
  }

  private async buildPublicCart(
    cart: Cart,
    userId: string,
    preloadedItems?: CartItem[],
  ): Promise<PublicCart> {
    const items =
      preloadedItems ?? (await this.loadItemsWithRelations(cart.id));
    const subtotal = this.computeSubtotal(items);

    let discountAmount = 0;
    let publicCoupon: PublicCart['coupon'] = null;
    let couponError: string | null = null;

    if (cart.appliedCouponId) {
      const discountCode = await this.discountCodeRepo.findOne({
        where: { id: cart.appliedCouponId },
      });
      try {
        if (!discountCode)
          throw new BadRequestException('کد تخفیف نامعتبر است');
        const result = await this.couponValidation.revalidate(
          discountCode,
          userId,
          subtotal,
        );
        discountAmount = result.discountAmount;
        publicCoupon = toPublicCartCoupon(discountCode);
      } catch (error) {
        couponError =
          error instanceof BadRequestException
            ? ((error.getResponse() as { message?: string }).message ??
              'کد تخفیف دیگر معتبر نیست')
            : 'کد تخفیف دیگر معتبر نیست';
        // Don't keep re-failing on every future fetch -- drop the now-invalid coupon.
        await this.cartRepo.update({ id: cart.id }, { appliedCouponId: null });
      }
    }

    const shippingAmount = 0;
    const taxAmount = 0;
    const totalAmount =
      Math.max(0, subtotal - discountAmount) + shippingAmount + taxAmount;

    return {
      items: items.map((item) =>
        toPublicCartItem(item, (key) => this.storageService.resolveUrl(key)),
      ),
      summary: {
        subtotal,
        discountAmount,
        shippingAmount,
        taxAmount,
        totalAmount,
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      },
      coupon: publicCoupon,
      couponError,
    };
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === UNIQUE_VIOLATION
    );
  }
}
