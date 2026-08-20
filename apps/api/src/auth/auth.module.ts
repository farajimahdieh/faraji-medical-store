import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OtpCode } from './entities/otp-code.entity';
import { Session } from './entities/session.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SessionGuard } from './guards/session.guard';
import { SMS_PROVIDER } from './sms/sms-provider.interface';
import { MockSmsProvider } from './sms/mock-sms.provider';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([OtpCode, Session]), UsersModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    SessionGuard,
    { provide: SMS_PROVIDER, useClass: MockSmsProvider },
  ],
  exports: [AuthService, SessionGuard],
})
export class AuthModule {}
