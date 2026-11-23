import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import type { AuthUser, JwtPayload, LoginInput, LoginResponse } from '@turbopre/shared';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly prismaService: PrismaService,
  ) {}

  async login(input: LoginInput): Promise<LoginResponse> {
    const username = input.username.trim();

    const user = await this.prismaService.user.findFirst({
      where: {
        username: { equals: username, mode: 'insensitive' },
        isActive: true,
      },
    });

    const isValid = user ? await compare(input.password, user.passwordHash) : false;

    if (!user || !isValid) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos');
    }

    await this.prismaService.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const authUser: AuthUser = {
      id: user.id,
      username: user.username,
      name: user.fullName,
      email: user.email,
      role: user.role,
    };

    const payload: JwtPayload = {
      sub: authUser.id,
      username: authUser.username,
      name: authUser.name,
      email: authUser.email,
      role: authUser.role,
    };

    return { accessToken: await this.jwt.signAsync(payload), user: authUser };
  }
}
