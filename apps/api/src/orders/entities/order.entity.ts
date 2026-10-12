import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { UserAddress } from '../../addresses/entities/user-address.entity';
import { DiscountCode } from '../../coupons/entities/discount-code.entity';
import { OrderItem } from './order-item.entity';

// Matches the project blueprint's own status list (docs/project-blueprint.md
// #18) plus 'refunded' for a completed return.
export enum OrderStatus {
  PENDING_PAYMENT = 'pending_payment',
  PAID = 'paid',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
}

// How the customer pays. Only offline methods exist until an online
// gateway is connected (it needs an eNamad first); staff confirm each order
// by phone and mark it paid in the admin panel once the money is received.
export enum PaymentMethod {
  CASH_ON_DELIVERY = 'cash_on_delivery',
  PAY_AT_STORE = 'pay_at_store',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  // Human-facing identifier (e.g. "F-20260826-483920"), app-generated --
  // this schema has no other sequence object, so a formatted timestamp +
  // random suffix (with a unique-violation retry) stays consistent with it.
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 30 })
  orderNumber: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING_PAYMENT,
  })
  status: OrderStatus;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  // Null on orders placed before payment methods existed.
  @Column({ type: 'enum', enum: PaymentMethod, nullable: true })
  paymentMethod: PaymentMethod | null;

  // Shipping address is snapshotted (not just a live FK) so a later edit or
  // deletion of the address never changes what a past order shows -- same
  // principle as the OrderItem product/price snapshot below. The location
  // fields are null for in-store pickup, where only name/phone are needed.
  @Column({ type: 'varchar', length: 150 })
  shippingRecipientName: string;

  @Column({ type: 'varchar', length: 20 })
  shippingRecipientPhone: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  shippingProvince: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  shippingCity: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  shippingAddressLine: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  shippingPostalCode: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  shippingBuildingNumber: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  shippingUnit: string | null;

  // Reference-only -- kept so the address can still be looked up while it
  // exists, but never read for display (the snapshot columns above are
  // authoritative). SET NULL so deleting an address never touches the order.
  @ManyToOne(() => UserAddress, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'addressId' })
  address: UserAddress | null;

  @Column({ type: 'uuid', nullable: true })
  addressId: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  shippingMethod: string | null;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  notes: string | null;

  // Toman, whole numbers -- same convention as product_variants.price.
  @Column({ type: 'integer' })
  subtotal: number;

  @Column({ type: 'integer', default: 0 })
  discountAmount: number;

  @ManyToOne(() => DiscountCode, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'discountCodeId' })
  discountCode: DiscountCode | null;

  @Column({ type: 'uuid', nullable: true })
  discountCodeId: string | null;

  // No shipping provider or tax rule chosen yet (see blueprint #20) -- these
  // stay 0 until that's decided, rather than inventing a fake rate.
  @Column({ type: 'integer', default: 0 })
  shippingAmount: number;

  @Column({ type: 'integer', default: 0 })
  taxAmount: number;

  @Column({ type: 'integer' })
  totalAmount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => OrderItem, (item) => item.order)
  items: OrderItem[];
}
