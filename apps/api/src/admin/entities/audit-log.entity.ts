import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
} from 'typeorm';

// Lightweight audit trail for sensitive admin actions. Never store
// password/OTP/token/secret values here -- metadata is limited to plain
// identifiers (e.g. a product name or coupon code), never raw request bodies.
@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  actorAdminId: string;

  // e.g. 'product.create', 'coupon.activate', 'admin.disable'.
  @Column({ type: 'varchar' })
  action: string;

  @Column({ type: 'varchar' })
  entityType: string;

  @Column({ type: 'varchar', nullable: true })
  entityId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;
}
