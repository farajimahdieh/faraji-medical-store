import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';
import { RequestWithUser } from './session.guard';

// Must run after SessionGuard (which populates request.user) -- the
// centralized place role checks live, so no controller compares
// `user.role` against a raw string itself. Super admin always satisfies an
// admin-level check. Admin roles additionally need an admin-login session
// of a still-active admin (request.adminAccess), so a customer OTP login
// or a disabled admin's old session never reaches admin routes.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user, adminAccess } = context
      .switchToHttp()
      .getRequest<RequestWithUser>();
    if (!user) return false;

    const roleMatches =
      user.role === UserRole.SUPER_ADMIN || requiredRoles.includes(user.role);
    if (!roleMatches) return false;
    return user.role === UserRole.CUSTOMER || adminAccess === true;
  }
}
