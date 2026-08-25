import { User } from './entities/user.entity';

export interface PublicUser {
  id: string;
  phone: string;
  firstName: string | null;
  lastName: string | null;
  birthDate: string | null;
  role: User['role'];
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    phone: user.phone,
    firstName: user.firstName,
    lastName: user.lastName,
    birthDate: user.birthDate,
    role: user.role,
  };
}
