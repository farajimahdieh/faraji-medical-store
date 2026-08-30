import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

// Staff-only credentials, kept off the customer `User` row so ADR-0005's
// "no password anywhere for customers" stays literally true. Created for a
// `User` only once it's promoted to admin/super_admin.
@Entity('admin_profiles')
export class AdminProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Index({ unique: true })
  @Column({ type: 'uuid' })
  userId: string;

  // Null until the invited admin completes activation (see AdminAuthService
  // .activate) -- a pending admin has no password yet and can't log in.
  @Column({ type: 'varchar', nullable: true })
  passwordHash: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  activatedAt: Date | null;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  failedLoginAttempts: number;

  @Column({ type: 'timestamptz', nullable: true })
  lockedUntil: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;

  // Who created this admin account -- null for the bootstrap super_admin,
  // which is created by the seed script rather than through the API.
  @Column({ type: 'uuid', nullable: true })
  createdByUserId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
