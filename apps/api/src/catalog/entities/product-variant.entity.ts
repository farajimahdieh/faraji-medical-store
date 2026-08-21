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
import { Product } from './product.entity';

// One row per accounting-software line item (e.g. one size of a product).
// price/stock/accountingId are owned by the accounting system and are
// only ever written here by the future sync job, never by an admin/import.
@Entity('product_variants')
@Index(['productId', 'size'], { unique: true })
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, (product) => product.variants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ type: 'uuid' })
  productId: string;

  // Null until this variant has been matched to a real accounting item.
  @Index({ unique: true })
  @Column({ type: 'varchar', nullable: true })
  accountingId: string | null;

  @Column({ type: 'varchar', nullable: true })
  accountingName: string | null;

  @Index()
  @Column()
  size: string;

  // Toman, whole numbers only. Null means "not yet synced" — never assume 0.
  @Column({ type: 'integer', nullable: true })
  price: number | null;

  // Null means "not yet synced" — must not be treated as 0/out-of-stock.
  @Column({ type: 'integer', nullable: true })
  stock: number | null;

  @Column({ default: true })
  isActive: boolean;

  // Null until the first accounting sync has run for this variant.
  @Column({ type: 'timestamptz', nullable: true })
  lastSyncedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
