import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DiscountCode } from './discount-code.entity';
import { User } from '../../users/entities/user.entity';

// Plain membership list backing CouponAudienceType.SPECIFIC_USERS -- not a
// rule engine, just "is this user on the list for this coupon".
@Entity('coupon_audience_members')
@Index('UQ_coupon_audience_members_coupon_user', ['discountCodeId', 'userId'], {
  unique: true,
})
export class CouponAudienceMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => DiscountCode, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'discountCodeId' })
  discountCode: DiscountCode;

  @Index()
  @Column({ type: 'uuid' })
  discountCodeId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  userId: string;
}
