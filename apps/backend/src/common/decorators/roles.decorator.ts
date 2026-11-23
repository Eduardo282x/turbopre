import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@turbopre/shared';

/** Metadata que lee `RolesGuard`. */
export const ROLES_KEY = 'required_roles';

/**
 * Restringe una ruta a los roles indicados.
 *
 * @example
 * @Roles('ADMIN')
 * @Get()
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
