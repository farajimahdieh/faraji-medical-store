import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserAddress } from './entities/user-address.entity';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { PublicUserAddress, toPublicAddress } from './addresses.public';
import { normalizeIranPhone } from '../common/phone.util';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(UserAddress)
    private readonly addressRepo: Repository<UserAddress>,
  ) {}

  async create(
    userId: string,
    dto: CreateAddressDto,
  ): Promise<PublicUserAddress> {
    const recipientPhone = this.normalizePhoneOrThrow(dto.recipientPhone);

    return this.addressRepo.manager.transaction(async (manager) => {
      const repo = manager.withRepository(this.addressRepo);
      const existingCount = await repo.count({ where: { userId } });
      const makeDefault = existingCount === 0 || dto.isDefault === true;

      if (makeDefault && existingCount > 0) {
        await this.clearDefault(repo, userId);
      }

      const address = repo.create({
        ...dto,
        recipientPhone,
        userId,
        isDefault: makeDefault,
      });
      const saved = await repo.save(address);
      return toPublicAddress(saved);
    });
  }

  async findAllForUser(userId: string): Promise<PublicUserAddress[]> {
    const addresses = await this.addressRepo.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
    return addresses.map(toPublicAddress);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateAddressDto,
  ): Promise<PublicUserAddress> {
    const recipientPhone =
      dto.recipientPhone !== undefined
        ? this.normalizePhoneOrThrow(dto.recipientPhone)
        : undefined;

    return this.addressRepo.manager.transaction(async (manager) => {
      const repo = manager.withRepository(this.addressRepo);
      const address = await repo.findOne({ where: { id, userId } });
      if (!address) {
        throw new NotFoundException('آدرس مورد نظر یافت نشد');
      }

      if (dto.isDefault === true && !address.isDefault) {
        await this.clearDefault(repo, userId);
      }

      const rest: Partial<UpdateAddressDto> = { ...dto };
      delete rest.recipientPhone;
      delete rest.isDefault;
      Object.assign(address, rest);
      if (recipientPhone !== undefined) {
        address.recipientPhone = recipientPhone;
      }
      if (dto.isDefault !== undefined) {
        address.isDefault = dto.isDefault;
      }

      const saved = await repo.save(address);
      return toPublicAddress(saved);
    });
  }

  async setDefault(userId: string, id: string): Promise<PublicUserAddress> {
    const address = await this.findOwnAddress(userId, id);
    if (address.isDefault) {
      return toPublicAddress(address);
    }

    return this.addressRepo.manager.transaction(async (manager) => {
      const repo = manager.withRepository(this.addressRepo);
      await this.clearDefault(repo, userId);
      address.isDefault = true;
      const saved = await repo.save(address);
      return toPublicAddress(saved);
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    const address = await this.findOwnAddress(userId, id);

    await this.addressRepo.delete({ id, userId });

    // Avoid silently leaving the user with no default address.
    if (address.isDefault) {
      const next = await this.addressRepo.findOne({
        where: { userId },
        order: { createdAt: 'DESC' },
      });
      if (next) {
        next.isDefault = true;
        await this.addressRepo.save(next);
      }
    }
  }

  private async findOwnAddress(
    userId: string,
    id: string,
  ): Promise<UserAddress> {
    const address = await this.addressRepo.findOne({ where: { id, userId } });
    if (!address) {
      throw new NotFoundException('آدرس مورد نظر یافت نشد');
    }
    return address;
  }

  private async clearDefault(
    repo: Repository<UserAddress>,
    userId: string,
  ): Promise<void> {
    await repo.update({ userId, isDefault: true }, { isDefault: false });
  }

  private normalizePhoneOrThrow(rawPhone: string): string {
    const phone = normalizeIranPhone(rawPhone);
    if (!phone) {
      throw new BadRequestException('شماره تماس گیرنده نامعتبر است');
    }
    return phone;
  }
}
