import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum OtpPurpose {
  CUSTOMER_LOGIN = 'customer_login',
  ADMIN_LOGIN = 'admin_login',
  ADMIN_ACTIVATION = 'admin_activation',
}

@Entity('otp_codes')
export class OtpCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  phone: string;

  // Isolates a code issued for one login flow from being replayed in the
  // other -- an admin's phone requesting a customer OTP (or vice versa)
  // must not be verifiable by a code sent for the other purpose.
  @Column({
    type: 'enum',
    enum: OtpPurpose,
    default: OtpPurpose.CUSTOMER_LOGIN,
  })
  purpose: OtpPurpose;

  @Column()
  codeHash: string;

  @Column({ default: 0 })
  attemptCount: number;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  consumedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
