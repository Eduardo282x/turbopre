import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import type { AuthUser, JwtPayload, LoginInput, LoginResponse } from '@turbopre/shared';
import type { UserRole } from '../generated/prisma/client.js';
import { AuditService } from '../audit/audit.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

type UserWithPosition = {
  id: string;
  username: string;
  fullName: string;
  email: string | null;
  role: UserRole;
  jobPosition: {
    id: string;
    code: string;
    name: string;
    process: {
      id: string;
      code: string;
      name: string;
    };
  } | null;
};

const USER_WITH_POSITION = {
  jobPosition: {
    include: {
      process: true,
    },
  },
} as const;

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly prismaService: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async login(input: LoginInput, ipAddress?: string): Promise<LoginResponse> {
    const username = input.username.trim();

    const user = await this.prismaService.user.findFirst({
      where: {
        username: { equals: username, mode: 'insensitive' },
        isActive: true,
      },
      include: USER_WITH_POSITION,
    });

    const isValid = user ? await compare(input.password, user.passwordHash) : false;

    if (!user || !isValid) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos');
    }

    await this.prismaService.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await this.auditService.record({
      userId: user.id,
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
      changes: { username: user.username },
      ipAddress,
    });

    const authUser = this.toAuthUser(user);
    const payload: JwtPayload = {
      sub: authUser.id,
      username: authUser.username,
      name: authUser.name,
      email: authUser.email,
      role: authUser.role,
      jobPositionId: authUser.jobPositionId,
      jobPositionCode: authUser.jobPositionCode,
      jobPositionName: authUser.jobPositionName,
      processId: authUser.processId,
      processCode: authUser.processCode,
      processName: authUser.processName,
    };

    return { accessToken: await this.jwt.signAsync(payload), user: authUser };
  }

  /**
   * Revalida el usuario contra la base de datos. Un usuario desactivado o
   * eliminado pierde el acceso aunque su JWT siga vigente.
   */
  async me(userId: string): Promise<AuthUser> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: USER_WITH_POSITION,
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('La sesión ya no es válida');
    }

    return this.toAuthUser(user);
  }

  private toAuthUser(user: UserWithPosition): AuthUser {
    return {
      id: user.id,
      username: user.username,
      name: user.fullName,
      email: user.email,
      role: user.role,
      jobPositionId: user.jobPosition?.id ?? null,
      jobPositionCode: user.jobPosition?.code ?? null,
      jobPositionName: user.jobPosition?.name ?? null,
      processId: user.jobPosition?.process.id ?? null,
      processCode: user.jobPosition?.process.code ?? null,
      processName: user.jobPosition?.process.name ?? null,
    };
  }
}
