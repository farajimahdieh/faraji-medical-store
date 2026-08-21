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
import { Brand } from './brand.entity';
import { Category } from './category.entity';
import { ProductVariant } from './product-variant.entity';
import { ProductImage } from './product-image.entity';
import { ProductSpecification } from './product-specification.entity';
import { ProductFeature } from './product-feature.entity';
import { SizeGuide } from './size-guide.entity';
import { ProductSource } from './product-source.entity';

export enum ProductStatus {
  DRAFT = 'draft',
  INCOMPLETE = 'incomplete',
  // Has the basics (name/brand/category/image) but something about it —
  // typically relevance or category confidence — needs a human look
  // before it's trusted as ACTIVE. Distinct from INCOMPLETE: the data
  // isn't missing, it's just unconfirmed.
  NEEDS_REVIEW = 'needs_review',
  ACTIVE = 'active',
  HIDDEN = 'hidden',
  ARCHIVED = 'archived',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Index({ unique: true })
  @Column()
  slug: string;

  @ManyToOne(() => Brand, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'brandId' })
  brand: Brand | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  brandId: string | null;

  @ManyToOne(() => Category, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoryId' })
  category: Category | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  categoryId: string | null;

  @Column({ type: 'varchar', nullable: true })
  shortDescription: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  // Set once an admin manually edits the description — importers must
  // skip overwriting it on subsequent syncs from an external source.
  @Column({ default: false })
  descriptionLocked: boolean;

  // Same as descriptionLocked, but for the image set.
  @Column({ default: false })
  imagesLocked: boolean;

  @Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.DRAFT })
  status: ProductStatus;

  @Column({ default: false })
  isFeatured: boolean;

  // A single product-specific instructional video, if the source has one.
  // Not a separate table: this catalog's sources have at most one video
  // per product — see ADR-0006 if that assumption ever changes.
  @Column({ type: 'varchar', nullable: true })
  videoUrl: string | null;

  @Column({ type: 'varchar', nullable: true })
  videoSource: string | null;

  // The matched video's own title (e.g. from the Aparat channel feed) —
  // used for review reporting and as a caption; not authoritative content.
  @Column({ type: 'varchar', nullable: true })
  videoTitle: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ProductVariant, (variant) => variant.product)
  variants: ProductVariant[];

  @OneToMany(() => ProductImage, (image) => image.product)
  images: ProductImage[];

  @OneToMany(() => ProductSpecification, (spec) => spec.product)
  specifications: ProductSpecification[];

  @OneToMany(() => ProductFeature, (feature) => feature.product)
  features: ProductFeature[];

  @OneToMany(() => SizeGuide, (sizeGuide) => sizeGuide.product)
  sizeGuides: SizeGuide[];

  @OneToMany(() => ProductSource, (source) => source.product)
  sources: ProductSource[];
}
