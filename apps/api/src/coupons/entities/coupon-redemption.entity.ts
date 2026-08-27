import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { DiscountCode } from './discount-code.entity';
import { Order } from '../../orders/entities/order.entity';

// One row per order that actually redeemed a coupon -- recorded only at
// successful checkout (never at "apply to cart" time), so an abandoned
// cart never burns a limited-use code. usageLimit/usagePerUser are
// enforced by counting these rows, not by a counter column on
// DiscountCode, to stay race-safe under concurrent checkouts.
@Entity('coupon_redemptions')
@Index('UQ_coupon_redemptions_order_code', ['orderId', 'discountCodeId'], {
  unique: true,
})
export class CouponRedemption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => DiscountCode, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'discountCodeId' })
  discountCode: DiscountCode;

  @Index()
  @Column({ type: 'uuid' })
  discountCodeId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ type: 'uuid' })
  orderId: string;

  @CreateDateColumn()
  createdAt: Date;
}
