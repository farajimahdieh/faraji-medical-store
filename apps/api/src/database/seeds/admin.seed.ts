// Bootstraps the first super_admin -- required because creating an admin
// normally requires an existing super_admin session (see admins.controller.ts).
// Safe to re-run: if a super_admin already exists, it exits without changing
// anything (no password reset, no duplicate account).
// Run with INITIAL_SUPER_ADMIN_PHONE and INITIAL_SUPER_ADMIN_PASSWORD set
// (e.g. in .env), then:
//   npm run admin:bootstrap
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import dataSource from '../data-source';
import { User, UserRole } from '../../users/entities/user.entity';
import { AdminProfile } from '../../auth/entities/admin-profile.entity';
import { normalizeIranPhone } from '../../common/phone.util';
import {
  STRONG_PASSWORD_MIN_LENGTH,
  STRONG_PASSWORD_PATTERN,
} from '../../auth/dto/activate-admin.dto';

export function validateSuperAdminPassword(password: string): string | null {
  if (
    password.length < STRONG_PASSWORD_MIN_LENGTH ||
    !STRONG_PASSWORD_PATTERN.test(password)
  ) {
    return `Password must be at least ${STRONG_PASSWORD_MIN_LENGTH} characters and include upper/lower case, a digit, and a special character`;
  }
  return null;
}

// Pure DB logic, independent of the CLI entrypoint below, so it can be
// unit-tested with hand-rolled repository mocks instead of a real DB.
export async function bootstrapSuperAdmin(
  userRepo: Repository<User>,
  adminProfileRepo: Repository<AdminProfile>,
  { phone, password }: { phone: string; password: string },
): Promise<{ created: boolean }> {
  const existingSuperAdmin = await userRepo.findOneBy({
    role: UserRole.SUPER_ADMIN,
  });
  if (existingSuperAdmin) {
    return { created: false };
  }

  let user = await userRepo.findOneBy({ phone });
  user = user ?? userRepo.create({ phone });
  user.role = UserRole.SUPER_ADMIN;
  user = await userRepo.save(user);

  const passwordHash = await bcrypt.hash(password, 12);
  await adminProfileRepo.save(
    adminProfileRepo.create({
      userId: user.id,
      passwordHash,
      isActive: true,
      activatedAt: new Date(),
    }),
  );

  return { created: true };
}

async function main() {
  const rawPhone = process.env.INITIAL_SUPER_ADMIN_PHONE;
  const password = process.env.INITIAL_SUPER_ADMIN_PASSWORD;
  const phone = rawPhone ? normalizeIranPhone(rawPhone) : null;

  if (!phone || !password) {
    console.error(
      'Usage: INITIAL_SUPER_ADMIN_PHONE=... INITIAL_SUPER_ADMIN_PASSWORD=... npm run admin:bootstrap',
    );
    process.exit(1);
  }

  const passwordError = validateSuperAdminPassword(password);
  if (passwordError) {
    console.error(passwordError);
    process.exit(1);
  }

  await dataSource.initialize();
  try {
    const result = await bootstrapSuperAdmin(
      dataSource.getRepository(User),
      dataSource.getRepository(AdminProfile),
      { phone, password },
    );
    console.log(
      result.created
        ? `super_admin created: ${phone}`
        : 'A super_admin already exists; skipping.',
    );
  } finally {
    await dataSource.destroy();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
