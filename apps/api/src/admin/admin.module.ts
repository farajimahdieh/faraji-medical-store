import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../users/entities/user.entity';
import { AdminProfile } from '../auth/entities/admin-profile.entity';
import { AdminsController } from './admins.controller';
import { AdminsService } from './admins.service';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, AdminProfile]),
    AuthModule,
    UsersModule,
  ],
  controllers: [AdminsController],
  providers: [AdminsService],
})
export class AdminModule {}
