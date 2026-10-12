import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User, UserRole } from '../users/entities/user.entity';
import { AdminProfile } from '../auth/entities/admin-profile.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from '../auth/auth.service';
import { normalizeIranPhone } from '../common/phone.util';
import { CreateAdminDto } from './dto/create-admin.dto';
import { PublicAdmin, toPublicAdmin } from './admin.public';
import { AuditLogService } from './audit-log.service';

@Injectable()
export class AdminsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(AdminProfile)
    private readonly adminProfileRepo: Repository<AdminProfile>,
    private readonly usersService: UsersService,
    private readonly auditLog: AuditLogService,
    private readonly authService: AuthService,
  ) {}

  async create(
    dto: CreateAdminDto,
    createdByUserId: string,
  ): Promise<PublicAdmin> {
    const phone = normalizeIranPhone(dto.phone);
    if (!phone) {
      throw new ConflictException('شماره موبایل نامعتبر است');
    }

    let user = await this.usersService.findByPhone(phone);
    if (user) {
      const existingProfile = await this.adminProfileRepo.findOne({
        where: { userId: user.id },
      });
      if (existingProfile) {
        throw new ConflictException(
          'این شماره موبایل قبلاً به‌عنوان ادمین ثبت شده است',
        );
      }
    } else {
      user = await this.usersService.createByPhone(phone);
    }

    user.firstName = dto.firstName;
    user.lastName = dto.lastName;
    user.role = dto.role ?? UserRole.ADMIN;
    await this.userRepo.save(user);

    // No password yet -- the invite is pending until the admin activates
    // it themselves via OTP (AdminAuthService.activate).
    const profile = await this.adminProfileRepo.save(
      this.adminProfileRepo.create({
        userId: user.id,
        passwordHash: null,
        activatedAt: null,
        createdByUserId,
      }),
    );

    await this.auditLog.record(
      createdByUserId,
      'admin.create',
      'admin',
      user.id,
      {
        phone,
        role: user.role,
      },
    );
    return toPublicAdmin(user, profile);
  }

  async list(): Promise<PublicAdmin[]> {
    const profiles = await this.adminProfileRepo.find({
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });
    return profiles.map((profile) => toPublicAdmin(profile.user, profile));
  }

  async setActive(
    userId: string,
    isActive: boolean,
    actorId: string,
  ): Promise<PublicAdmin> {
    const { user, profile } = await this.findByUserId(userId);
    profile.isActive = isActive;
    await this.adminProfileRepo.save(profile);
    // Disabling must take effect now, not when the admin's session expires.
    if (!isActive) await this.authService.revokeAllSessions(userId);
    await this.auditLog.record(
      actorId,
      isActive ? 'admin.enable' : 'admin.disable',
      'admin',
      userId,
    );
    return toPublicAdmin(user, profile);
  }

  async setRole(
    userId: string,
    role: UserRole.ADMIN | UserRole.SUPER_ADMIN,
    actorId: string,
  ): Promise<PublicAdmin> {
    const { user, profile } = await this.findByUserId(userId);
    user.role = role;
    await this.userRepo.save(user);
    await this.auditLog.record(actorId, 'admin.set-role', 'admin', userId, {
      role,
    });
    return toPublicAdmin(user, profile);
  }

  private async findByUserId(
    userId: string,
  ): Promise<{ user: User; profile: AdminProfile }> {
    const profile = await this.adminProfileRepo.findOne({
      where: { userId },
      relations: { user: true },
    });
    if (!profile) {
      throw new NotFoundException('ادمین یافت نشد');
    }
    return { user: profile.user, profile };
  }
}
