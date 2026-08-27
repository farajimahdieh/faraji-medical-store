import { IsIn } from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export class SetAdminRoleDto {
  @IsIn([UserRole.ADMIN, UserRole.SUPER_ADMIN])
  role: UserRole.ADMIN | UserRole.SUPER_ADMIN;
}
