import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { RolesGuard } from './roles.guard';
import { UserRole } from '../../users/entities/user.entity';

function contextFor(request: object): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const reflector = {
    getAllAndOverride: () => [UserRole.ADMIN, UserRole.SUPER_ADMIN],
  } as unknown as Reflector;
  const guard = new RolesGuard(reflector);

  it('lets an admin through only with admin access', () => {
    const user = { role: UserRole.ADMIN };
    expect(guard.canActivate(contextFor({ user, adminAccess: true }))).toBe(
      true,
    );
    expect(guard.canActivate(contextFor({ user, adminAccess: false }))).toBe(
      false,
    );
    expect(guard.canActivate(contextFor({ user }))).toBe(false);
  });

  it('applies the same rule to super admins', () => {
    const user = { role: UserRole.SUPER_ADMIN };
    expect(guard.canActivate(contextFor({ user, adminAccess: false }))).toBe(
      false,
    );
  });

  it('rejects customers from admin routes', () => {
    const user = { role: UserRole.CUSTOMER };
    expect(guard.canActivate(contextFor({ user, adminAccess: true }))).toBe(
      false,
    );
  });
});
