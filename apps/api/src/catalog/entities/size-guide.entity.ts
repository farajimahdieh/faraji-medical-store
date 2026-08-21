import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('size_guides')
export class SizeGuide {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, (product) => product.sizeGuides, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ type: 'uuid' })
  productId: string;

  @Column()
  size: string;

  @Column({ type: 'real' })
  minValue: number;

  @Column({ type: 'real' })
  maxValue: number;

  @Column()
  unit: string;

  @Column()
  measurementPoint: string;

  @CreateDateColumn()
  createdAt: Date;
}
