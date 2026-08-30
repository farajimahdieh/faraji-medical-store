import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { DiscountCode } from './entities/discount-code.entity';
import { CouponAudienceMember } from './entities/coupon-audience-member.entity';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { AuditLogService } from '../admin/audit-log.service';

@Injectable()
export class AdminCouponsService {
  constructor(
    @InjectRepository(DiscountCode)
    private readonly discountCodeRepo: Repository<DiscountCode>,
    @InjectRepository(CouponAudienceMember)
    private readonly audienceMemberRepo: Repository<CouponAudienceMember>,
    private readonly auditLog: AuditLogService,
  ) {}

  list(): Promise<DiscountCode[]> {
    return this.discountCodeRepo.find({ order: { createdAt: 'DESC' } });
  }

  async getById(id: string): Promise<DiscountCode> {
    const coupon = await this.discountCodeRepo.findOneBy({ id });
    if (!coupon) {
      throw new NotFoundException('کد تخفیف یافت نشد');
    }
    return coupon;
  }

  async create(dto: CreateCouponDto, actorId: string): Promise<DiscountCode> {
    const code = dto.code.trim().toUpperCase();
    const existing = await this.discountCodeRepo.findOneBy({ code });
    if (existing) {
      throw new ConflictException('کدی با این نام قبلاً ثبت شده است');
    }

    const { audienceUserIds, ...rest } = dto;
    const coupon = await this.discountCodeRepo.save(
      this.discountCodeRepo.create({
        ...rest,
        code,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        createdByAdminId: actorId,
      }),
    );
    await this.syncAudienceMembers(coupon.id, audienceUserIds);

    await this.auditLog.record(actorId, 'coupon.create', 'coupon', coupon.id, {
      code,
    });
    return coupon;
  }

  async update(
    id: string,
    dto: UpdateCouponDto,
    actorId: string,
  ): Promise<DiscountCode> {
    const coupon = await this.getById(id);
    const { audienceUserIds, ...rest } = dto;

    if (rest.code) rest.code = rest.code.trim().toUpperCase();
    Object.assign(coupon, rest);
    if (dto.startsAt !== undefined)
      coupon.startsAt = dto.startsAt ? new Date(dto.startsAt) : null;
    if (dto.expiresAt !== undefined)
      coupon.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;

    await this.discountCodeRepo.save(coupon);
    if (audienceUserIds !== undefined) {
      await this.syncAudienceMembers(id, audienceUserIds);
    }

    const action =
      dto.isActive === undefined
        ? 'coupon.update'
        : dto.isActive
          ? 'coupon.activate'
          : 'coupon.deactivate';
    await this.auditLog.record(actorId, action, 'coupon', id);
    return this.getById(id);
  }

  private async syncAudienceMembers(
    discountCodeId: string,
    userIds?: string[],
  ): Promise<void> {
    if (userIds === undefined) return;
    await this.audienceMemberRepo.delete({ discountCodeId });
    if (userIds.length === 0) return;
    await this.audienceMemberRepo.save(
      userIds.map((userId) =>
        this.audienceMemberRepo.create({ discountCodeId, userId }),
      ),
    );
  }
}
