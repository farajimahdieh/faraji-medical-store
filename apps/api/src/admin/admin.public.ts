import { User, UserRole } from '../users/entities/user.entity';
import { AdminProfile } from '../auth/entities/admin-profile.entity';

export interface PublicAdmin {
  id: string;
  phone: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  isActive: boolean;
  activatedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export function toPublicAdmin(user: User, profile: AdminProfile): PublicAdmin {
  return {
    id: user.id,
    phone: user.phone,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isActive: profile.isActive,
    activatedAt: profile.activatedAt,
    lastLoginAt: profile.lastLoginAt,
    createdAt: profile.createdAt,
  };
}
