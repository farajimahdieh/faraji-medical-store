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
import { Product } from '../../catalog/entities/product.entity';

// One row per (userId, productId) -- re-viewing a product updates viewedAt
// in place rather than creating a duplicate row.
@Entity('recently_viewed_products')
@Index('UQ_recently_viewed_user_product', ['userId', 'productId'], {
  unique: true,
})
export class RecentlyViewedProduct {
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

  @Column({ type: 'timestamptz' })
  viewedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
