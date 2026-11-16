import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthUser } from '@turbopre/shared';

/** Inyecta el usuario que dejó el JwtAuthGuard en la petición. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser | undefined =>
    context.switchToHttp().getRequest<{ user?: AuthUser }>().user,
);
