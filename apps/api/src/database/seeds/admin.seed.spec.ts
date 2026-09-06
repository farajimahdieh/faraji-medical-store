import { bootstrapSuperAdmin } from './admin.seed';
import { UserRole } from '../../users/entities/user.entity';

function buildUserRepoMock(existing: { role?: UserRole; phone?: string } | null) {
  return {
    findOneBy: jest.fn((where) => {
      if (where.role && existing?.role === where.role) return Promise.resolve(existing);
      if (where.phone && existing?.phone === where.phone) return Promise.resolve(existing);
      return Promise.resolve(null);
    }),
    create: jest.fn((entity) => entity),
    save: jest.fn((entity) => Promise.resolve({ id: 'user-1', ...entity })),
  };
}

function buildAdminProfileRepoMock() {
  return {
    create: jest.fn((entity) => entity),
    save: jest.fn((entity) => Promise.resolve(entity)),
  };
}

describe('bootstrapSuperAdmin', () => {
  const PHONE = '+989300000001';
  const PASSWORD = 'Str0ng!Passw0rd';

  it('creates the first super_admin with a hashed, active password', async () => {
    const userRepo = buildUserRepoMock(null);
    const adminProfileRepo = buildAdminProfileRepoMock();

    const result = await bootstrapSuperAdmin(userRepo as any, adminProfileRepo as any, {
      phone: PHONE,
      password: PASSWORD,
    });

    expect(result).toEqual({ created: true });
    expect(userRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ phone: PHONE, role: UserRole.SUPER_ADMIN }),
    );
    expect(adminProfileRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', isActive: true }),
    );
    const savedProfile = adminProfileRepo.save.mock.calls[0][0];
    expect(savedProfile.passwordHash).not.toEqual(PASSWORD);
    expect(savedProfile.activatedAt).toBeInstanceOf(Date);
  });

  it('does not create a second super_admin if one already exists', async () => {
    const userRepo = buildUserRepoMock({ role: UserRole.SUPER_ADMIN });
    const adminProfileRepo = buildAdminProfileRepoMock();

    const result = await bootstrapSuperAdmin(userRepo as any, adminProfileRepo as any, {
      phone: PHONE,
      password: PASSWORD,
    });

    expect(result).toEqual({ created: false });
    expect(userRepo.save).not.toHaveBeenCalled();
    expect(adminProfileRepo.save).not.toHaveBeenCalled();
  });
});
