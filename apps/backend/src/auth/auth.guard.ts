import {
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AuthUser } from '@turbopre/shared';
import { jwtPayloadSchema } from '@turbopre/shared';

type RequestWithUser = {
  headers: Record<string, string | string[] | undefined>;
  user?: AuthUser;
};

/**
 * Valida el JWT del encabezado Authorization y deja el usuario en `request.user`.
 * Los tokens viejos o manipulados se rechazan con 401.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const authorization = request.headers.authorization;
    const header = Array.isArray(authorization) ? authorization[0] : authorization;
    const [type, token] = header?.split(' ') ?? [];

    if (type?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException('Token de acceso no proporcionado');
    }

    try {
      const payload = jwtPayloadSchema.parse(await this.jwt.verifyAsync(token));

      request.user = {
        id: payload.sub,
        username: payload.username,
        name: payload.name,
        email: payload.email,
        role: payload.role,
      };
    } catch {
      throw new UnauthorizedException('Token de acceso inválido o expirado');
    }

    return true;
  }
}
