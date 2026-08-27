import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
}

// A code is either general-purpose (userId null -- anyone can use it,
// subject to future checkout logic enforcing usageLimit/usagePerUser) or
// issued to one specific user (e.g. a future birthday-campaign grant) --
// never both. No admin CRUD exists yet; rows are inserted by hand for now.
@Entity('discount_codes')
export class DiscountCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50 })
  code: string;

  @Column({ type: 'enum', enum: DiscountType })
  type: DiscountType;

  // PERCENTAGE: whole-number percent (15 = 15%).
  // FIXED_AMOUNT: Toman, whole numbers only -- same convention as
  // product_variants.price (no decimal/numeric money type precedent exists).
  @Column({ type: 'integer' })
  value: number;

  @Column({ type: 'timestamptz', nullable: true })
  startsAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  // Null = unlimited. Not enforced anywhere yet -- no redemption tracking
  // exists; that's checkout-integration work, out of scope for now.
  @Column({ type: 'integer', nullable: true })
  usageLimit: number | null;

  @Column({ type: 'integer', nullable: true })
  usagePerUser: number | null;

  @Column({ type: 'integer', nullable: true })
  minimumOrderAmount: number | null;

  // PERCENTAGE only -- caps the computed discount at this many Toman so a
  // "20% off" code can't blow out on an unexpectedly large order. Ignored
  // for FIXED_AMOUNT (the value itself is already the cap).
  @Column({ type: 'integer', nullable: true })
  maxDiscountAmount: number | null;

  @Column({ default: true })
  isActive: boolean;

  // Null = general-purpose code. Non-null = issued to exactly one user.
  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
