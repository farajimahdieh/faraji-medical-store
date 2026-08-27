// Bootstraps the first super_admin -- required because creating an admin
// normally requires an existing super_admin session (see admins.controller.ts).
// Run with:
//   SUPER_ADMIN_PHONE=09xxxxxxxxx SUPER_ADMIN_PASSWORD=... SUPER_ADMIN_FIRST_NAME=... \
//   node --env-file=.env -r ts-node/register -r tsconfig-paths/register src/database/seeds/admin.seed.ts
import * as bcrypt from 'bcrypt';
import dataSource from '../data-source';
import { User, UserRole } from '../../users/entities/user.entity';
import { AdminProfile } from '../../auth/entities/admin-profile.entity';
import { normalizeIranPhone } from '../../common/phone.util';

async function seed() {
  const rawPhone = process.env.SUPER_ADMIN_PHONE;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const firstName = process.env.SUPER_ADMIN_FIRST_NAME ?? 'Super';
  const lastName = process.env.SUPER_ADMIN_LAST_NAME ?? 'Admin';

  const phone = rawPhone ? normalizeIranPhone(rawPhone) : null;
  if (!phone || !password) {
    console.error(
      'Usage: SUPER_ADMIN_PHONE=... SUPER_ADMIN_PASSWORD=... node ... admin.seed.ts',
    );
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('SUPER_ADMIN_PASSWORD must be at least 8 characters');
    process.exit(1);
  }

  await dataSource.initialize();

  const userRepo = dataSource.getRepository(User);
  const adminProfileRepo = dataSource.getRepository(AdminProfile);

  let user = await userRepo.findOneBy({ phone });
  if (!user) {
    user = userRepo.create({ phone });
  }
  user.firstName = firstName;
  user.lastName = lastName;
  user.role = UserRole.SUPER_ADMIN;
  user = await userRepo.save(user);

  const existingProfile = await adminProfileRepo.findOneBy({ userId: user.id });
  const passwordHash = await bcrypt.hash(password, 12);

  if (existingProfile) {
    existingProfile.passwordHash = passwordHash;
    existingProfile.isActive = true;
    await adminProfileRepo.save(existingProfile);
  } else {
    await adminProfileRepo.save(adminProfileRepo.create({ userId: user.id, passwordHash }));
  }

  console.log(`super_admin ready: ${phone}`);
  await dataSource.destroy();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
