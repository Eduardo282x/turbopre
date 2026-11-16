import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import type { AuthUser, JwtPayload, LoginInput, LoginResponse } from '@turbopre/shared';
import { PrismaService } from '../prisma/prisma.service.js';
import { DEMO_PASSWORD_HASH, DEMO_USER } from './demo-user.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private get demoMode(): boolean {
    return (this.config.get<string>('AUTH_DEMO') ?? 'true') === 'true';
  }

  async login(input: LoginInput): Promise<LoginResponse> {
    const user = this.demoMode ? await this.loginDemo(input) : await this.loginWithDatabase(input);

    const payload: JwtPayload = {
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return { accessToken: await this.jwt.signAsync(payload), user };
  }

  /** Rama demo: usuario en memoria, sin tocar PostgreSQL. */
  private async loginDemo(input: LoginInput): Promise<AuthUser> {
    const isValid =
      input.email.toLowerCase() === DEMO_USER.email && (await compare(input.password, DEMO_PASSWORD_HASH));

    if (!isValid) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }

    this.logger.debug(`Login demo de ${DEMO_USER.email}`);
    return DEMO_USER;
  }

  /** Rama real: valida el usuario contra la tabla `users` de PostgreSQL. */
  private async loginWithDatabase(input: LoginInput): Promise<AuthUser> {
    const user = await this.prisma.db.user.findUnique({ where: { email: input.email.toLowerCase() } });
    const isValid = user ? await compare(input.password, user.password) : false;

    if (!user || !isValid) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }

    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }
}
