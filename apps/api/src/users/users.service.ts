import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findByPhone(phone: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ phone });
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }

  createByPhone(phone: string): Promise<User> {
    const user = this.usersRepository.create({ phone });
    return this.usersRepository.save(user);
  }

  async updateProfile(
    userId: string,
    updates: { firstName: string; lastName: string; birthDate?: string },
  ): Promise<User> {
    const user = await this.usersRepository.findOneByOrFail({ id: userId });
    user.firstName = updates.firstName;
    user.lastName = updates.lastName;
    // Only touch birthDate when the caller explicitly sent it, so a
    // name-only update never wipes a previously-set birth date.
    if (updates.birthDate !== undefined) {
      user.birthDate = updates.birthDate;
    }
    return this.usersRepository.save(user);
  }
}
