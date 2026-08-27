import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OtpCode } from './entities/otp-code.entity';
import { Session } from './entities/session.entity';
import { AdminProfile } from './entities/admin-profile.entity';
import { AuthService } from './auth.service';
import { AdminAuthService } from './admin-auth.service';
import { AuthController } from './auth.controller';
import { AdminAuthController } from './admin-auth.controller';
import { SessionGuard } from './guards/session.guard';
import { RolesGuard } from './guards/roles.guard';
import { SMS_PROVIDER } from './sms/sms-provider.interface';
import { MockSmsProvider } from './sms/mock-sms.provider';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([OtpCode, Session, AdminProfile]),
    UsersModule,
  ],
  controllers: [AuthController, AdminAuthController],
  providers: [
    AuthService,
    AdminAuthService,
    SessionGuard,
    RolesGuard,
    { provide: SMS_PROVIDER, useClass: MockSmsProvider },
  ],
  exports: [AuthService, SessionGuard, RolesGuard],
})
export class AuthModule {}
