import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../users/entities/user.entity';
import { AdminProfile } from '../auth/entities/admin-profile.entity';
import { AuditLog } from './entities/audit-log.entity';
import { AdminsController } from './admins.controller';
import { AdminsService } from './admins.service';
import { AuditLogService } from './audit-log.service';
import { AuditLogsController } from './audit-logs.controller';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, AdminProfile, AuditLog]),
    AuthModule,
    UsersModule,
  ],
  controllers: [AdminsController, AuditLogsController],
  providers: [AdminsService, AuditLogService],
  exports: [AuditLogService],
})
export class AdminModule {}
