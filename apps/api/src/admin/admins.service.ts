import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User, UserRole } from '../users/entities/user.entity';
import { AdminProfile } from '../auth/entities/admin-profile.entity';
import { UsersService } from '../users/users.service';
import { normalizeIranPhone } from '../common/phone.util';
import { CreateAdminDto } from './dto/create-admin.dto';
import { PublicAdmin, toPublicAdmin } from './admin.public';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AdminsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(AdminProfile)
    private readonly adminProfileRepo: Repository<AdminProfile>,
    private readonly usersService: UsersService,
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
    user.role = UserRole.ADMIN;
    await this.userRepo.save(user);

    const profile = await this.adminProfileRepo.save(
      this.adminProfileRepo.create({
        userId: user.id,
        passwordHash: await bcrypt.hash(dto.password, BCRYPT_ROUNDS),
        createdByUserId,
      }),
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

  async setActive(userId: string, isActive: boolean): Promise<PublicAdmin> {
    const { user, profile } = await this.findByUserId(userId);
    profile.isActive = isActive;
    await this.adminProfileRepo.save(profile);
    return toPublicAdmin(user, profile);
  }

  async setRole(
    userId: string,
    role: UserRole.ADMIN | UserRole.SUPER_ADMIN,
  ): Promise<PublicAdmin> {
    const { user, profile } = await this.findByUserId(userId);
    user.role = role;
    await this.userRepo.save(user);
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
