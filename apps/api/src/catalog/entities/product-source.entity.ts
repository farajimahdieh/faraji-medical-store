import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Product } from './product.entity';

// Tracks where a product's catalog data (description/images/specs) was
// imported from, so re-running an import can match an existing product
// instead of creating a duplicate.
@Entity('product_sources')
@Index(['sourceName', 'externalProductCode'], { unique: true })
export class ProductSource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, (product) => product.sources, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ type: 'uuid' })
  productId: string;

  // e.g. "teb-sanat"
  @Column()
  sourceName: string;

  @Column({ type: 'varchar', nullable: true })
  sourceUrl: string | null;

  @Column({ type: 'varchar', nullable: true })
  externalProductCode: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastImportedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
