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
import { Product } from '../../catalog/entities/product.entity';
import { ProductVariant } from '../../catalog/entities/product-variant.entity';

// One row per product (optionally, one specific variant/size) a user has
// saved. A single UNIQUE(userId, productId, variantId) constraint can't stop
// duplicate product-level entries because Postgres treats every NULL as
// distinct — so "no variant chosen yet" is enforced with its own partial
// index instead of folding into the three-column one.
@Entity('wishlist_items')
@Index('UQ_wishlist_user_product_no_variant', ['userId', 'productId'], {
  unique: true,
  where: '"variantId" IS NULL',
})
@Index(
  'UQ_wishlist_user_product_variant',
  ['userId', 'productId', 'variantId'],
  { unique: true, where: '"variantId" IS NOT NULL' },
)
export class WishlistItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ type: 'uuid' })
  productId: string;

  // Null means "saved at the product level, no size chosen". SET NULL (not
  // CASCADE) on variant removal so the item falls back to a product-level
  // entry instead of vanishing when a size is discontinued.
  @ManyToOne(() => ProductVariant, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'variantId' })
  variant: ProductVariant | null;

  @Column({ type: 'uuid', nullable: true })
  variantId: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  note: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
