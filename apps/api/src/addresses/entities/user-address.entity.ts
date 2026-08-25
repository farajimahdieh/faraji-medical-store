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

// Only one address per user may be the default. Postgres treats every NULL
// as distinct, so a plain UNIQUE(userId) can't express "at most one true" —
// enforced instead with a partial unique index, the same technique already
// used for wishlist_items' "at most one no-variant row per product" rule.
@Entity('user_addresses')
@Index('UQ_user_addresses_user_default', ['userId'], {
  unique: true,
  where: '"isDefault" = true',
})
export class UserAddress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  // Free text — e.g. "خانه"/"محل کار"/custom. Presets are a frontend concern.
  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ type: 'varchar', length: 150 })
  recipientName: string;

  // Normalized to the same +98XXXXXXXXXX shape as User.phone. Deliberately
  // independent of the account's auth phone — the recipient can differ.
  @Column({ type: 'varchar', length: 20 })
  recipientPhone: string;

  @Column({ type: 'varchar', length: 100 })
  province: string;

  @Column({ type: 'varchar', length: 100 })
  city: string;

  @Column({ type: 'varchar', length: 500 })
  addressLine: string;

  @Column({ type: 'varchar', length: 10 })
  postalCode: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  buildingNumber: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  unit: string | null;

  @Column({ default: false })
  isDefault: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
