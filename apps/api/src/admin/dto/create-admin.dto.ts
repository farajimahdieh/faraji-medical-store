import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

// No password here -- the invited admin sets their own via the OTP
// activation flow (AdminAuthService.activate). See ADR-0007.
export class CreateAdminDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsOptional()
  @IsIn([UserRole.ADMIN, UserRole.SUPER_ADMIN])
  role?: UserRole.ADMIN | UserRole.SUPER_ADMIN;
}
