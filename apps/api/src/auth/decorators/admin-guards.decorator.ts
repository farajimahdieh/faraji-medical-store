import { applyDecorators, UseGuards } from '@nestjs/common';

import { Roles } from './roles.decorator';
import { SessionGuard } from '../guards/session.guard';
import { RolesGuard } from '../guards/roles.guard';
import { UserRole } from '../../users/entities/user.entity';

// One-line guard for admin routes -- composes session auth + role check so
// controllers never repeat `@UseGuards(SessionGuard, RolesGuard)` and never
// spell out a role string themselves.
export const AdminOnly = () =>
  applyDecorators(
    UseGuards(SessionGuard, RolesGuard),
    Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  );

export const SuperAdminOnly = () =>
  applyDecorators(
    UseGuards(SessionGuard, RolesGuard),
    Roles(UserRole.SUPER_ADMIN),
  );
