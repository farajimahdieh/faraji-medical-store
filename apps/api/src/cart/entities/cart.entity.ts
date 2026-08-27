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
import { CartItem } from './cart-item.entity';

export enum CartStatus {
  ACTIVE = 'active',
  CONVERTED = 'converted',
}

// Only one ACTIVE cart per user -- enforced with a partial unique index
// (Postgres treats every NULL as distinct, so this can't be a plain
// UNIQUE(userId); same technique already used for user_addresses' default
// flag and wishlist_items' no-variant row). Checkout marks this cart
// CONVERTED instead of deleting it, so a user's checkout history is
// reconstructable; the next add-to-cart lazily creates a fresh active one.
@Entity('carts')
@Index('UQ_carts_user_active', ['userId'], {
  unique: true,
  where: `"status" = 'active'`,
})
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'enum', enum: CartStatus, default: CartStatus.ACTIVE })
  status: CartStatus;

  // Set once a coupon is applied to this cart; re-validated (and, on
  // checkout, redeemed) against live DiscountCode state -- never trusted
  // as a stored discount amount.
  @Column({ type: 'uuid', nullable: true })
  appliedCouponId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => CartItem, (item) => item.cart)
  items: CartItem[];
}
