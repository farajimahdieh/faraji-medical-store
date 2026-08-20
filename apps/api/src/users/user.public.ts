import { User } from './entities/user.entity';

export interface PublicUser {
  id: string;
  phone: string;
  firstName: string | null;
  lastName: string | null;
  role: User['role'];
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    phone: user.phone,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  };
}
