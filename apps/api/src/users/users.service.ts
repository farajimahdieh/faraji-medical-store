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

  async setName(
    userId: string,
    firstName: string,
    lastName: string,
  ): Promise<User> {
    const user = await this.usersRepository.findOneByOrFail({ id: userId });
    user.firstName = firstName;
    user.lastName = lastName;
    return this.usersRepository.save(user);
  }
}
