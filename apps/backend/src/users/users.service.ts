import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hash } from 'bcryptjs';
import type {
  CreateUserInput,
  ResetPasswordInput,
  UpdateUserInput,
  UserListItem,
  UserOption,
} from '@turbopre/shared';
import { USER_ROLES } from '@turbopre/shared';
import { Prisma, type UserRole } from '../generated/prisma/client.js';
import { AuditService } from '../audit/audit.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

type UserWithRelations = {
  id: string;
  username: string;
  email: string | null;
  fullName: string;
  role: UserRole;
  jobPositionId: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
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

const USER_INCLUDE = {
  jobPosition: {
    include: {
      process: true,
    },
  },
} as const;

const TASK_ROLES: readonly UserRole[] = ['OPERATOR', 'ENGINEER', 'QUALITY'];

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(search?: string): Promise<UserListItem[]> {    const term = search?.trim();
    const where: Prisma.UserWhereInput = term
      ? {
          OR: [
            { username: { contains: term, mode: 'insensitive' } },
            { fullName: { contains: term, mode: 'insensitive' } },
            { email: { contains: term, mode: 'insensitive' } },
          ],
        }
      : {};

    const users = await this.prisma.user.findMany({
      where,
      include: USER_INCLUDE,
      orderBy: [{ isActive: 'desc' }, { fullName: 'asc' }],
    });

    return users.map((user) => this.toListItem(user));
  }

  async options(roles?: string[]): Promise<UserOption[]> {
    const validRoles = roles
      ?.map((role) => role.trim().toUpperCase())
      .filter((role): role is UserRole => USER_ROLES.includes(role as UserRole));

    const users = await this.prisma.user.findMany({
      where: {
        isActive: true,
        ...(validRoles && validRoles.length > 0 ? { role: { in: validRoles } } : {}),
      },
      select: {
        id: true,
        fullName: true,
        username: true,
        role: true,
      },
      orderBy: { fullName: 'asc' },
    });

    return users.map((user) => ({
      id: user.id,
      name: user.fullName,
      username: user.username,
      role: user.role,
    }));
  }

  async create(input: CreateUserInput, actorId: string): Promise<UserListItem> {
    const jobPositionId = await this.resolveJobPosition(
      input.role,
      input.jobPositionId ?? null,
    );
    const passwordHash = await hash(input.password, 10);

    try {
      const user = await this.prisma.user.create({
        data: {
          username: input.username,
          email: input.email ?? null,
          passwordHash,
          fullName: input.fullName,
          role: input.role,
          jobPositionId,
          createdById: actorId,
        },
        include: USER_INCLUDE,
      });

      await this.audit.record({
        userId: actorId,
        action: 'CREATE',
        entity: 'User',
        entityId: user.id,
        changes: {
          after: {
            username: user.username,
            fullName: user.fullName,
            role: user.role,
            jobPositionId: user.jobPositionId,
            isActive: user.isActive,
          },
        },
      });

      return this.toListItem(user);
    } catch (error) {
      this.rethrowUniqueError(error);
    }
  }

  async update(
    id: string,
    input: UpdateUserInput,
    actorId: string,
  ): Promise<UserListItem> {
    const target = await this.prisma.user.findUnique({
      where: { id },
      include: USER_INCLUDE,
    });

    if (!target) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const nextRole = input.role ?? target.role;
    const nextActive = input.isActive ?? target.isActive;

    if (id === actorId && (!nextActive || nextRole !== target.role)) {
      throw new BadRequestException(
        'No puedes desactivar tu propia cuenta ni cambiar tu propio rol',
      );
    }

    if (target.role === 'ADMIN' && target.isActive && (nextRole !== 'ADMIN' || !nextActive)) {
      const remainingAdmins = await this.prisma.user.count({
        where: { role: 'ADMIN', isActive: true, id: { not: id } },
      });

      if (remainingAdmins === 0) {
        throw new BadRequestException('Debe quedar al menos un administrador activo');
      }
    }

    let nextJobPositionId: string | null | undefined;

    if (input.role !== undefined && input.role !== target.role) {
      nextJobPositionId = await this.resolveJobPosition(
        nextRole,
        input.jobPositionId ?? null,
      );
    } else if (input.jobPositionId !== undefined) {
      nextJobPositionId = await this.resolveJobPosition(nextRole, input.jobPositionId);
    }

    const data: Prisma.UserUpdateInput = {
      ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.role !== undefined ? { role: input.role } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(nextJobPositionId !== undefined
        ? {
            jobPosition: nextJobPositionId
              ? { connect: { id: nextJobPositionId } }
              : { disconnect: true },
          }
        : {}),
    };

    try {
      const user = await this.prisma.user.update({
        where: { id },
        data,
        include: USER_INCLUDE,
      });

      await this.audit.record({
        userId: actorId,
        action: 'UPDATE',
        entity: 'User',
        entityId: user.id,
        changes: {
          before: {
            fullName: target.fullName,
            email: target.email,
            role: target.role,
            jobPositionId: target.jobPositionId,
            isActive: target.isActive,
          },
          after: {
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            jobPositionId: user.jobPositionId,
            isActive: user.isActive,
          },
        },
      });

      return this.toListItem(user);
    } catch (error) {
      this.rethrowUniqueError(error);
    }
  }

  async resetPassword(
    id: string,
    input: ResetPasswordInput,
    actorId: string,
  ): Promise<void> {
    const target = await this.prisma.user.findUnique({ where: { id } });

    if (!target) {
      throw new NotFoundException('Usuario no encontrado');
    }

    await this.prisma.user.update({
      where: { id },
      data: { passwordHash: await hash(input.password, 10) },
    });

    await this.audit.record({
      userId: actorId,
      action: 'UPDATE',
      entity: 'User',
      entityId: id,
      changes: { passwordReset: true },
    });
  }

  private async resolveJobPosition(
    role: UserRole,
    jobPositionId: string | null,
  ): Promise<string | null> {
    if (!TASK_ROLES.includes(role)) {
      return null;
    }

    if (!jobPositionId) {
      throw new BadRequestException(
        `El rol ${role} necesita un puesto de trabajo asignado`,
      );
    }

    const position = await this.prisma.jobPosition.findUnique({
      where: { id: jobPositionId },
      include: { process: true },
    });

    if (!position || !position.isActive) {
      throw new BadRequestException('El puesto de trabajo no existe o está inactivo');
    }

    const expectedKind =
      role === 'OPERATOR' ? 'WORKSHOP' : role === 'ENGINEER' ? 'ENGINEERING' : 'QUALITY';

    if (position.process.kind !== expectedKind) {
      throw new BadRequestException(
        `El puesto ${position.name} no pertenece al área correspondiente al rol ${role}`,
      );
    }

    return position.id;
  }

  private toListItem(user: UserWithRelations): UserListItem {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      jobPositionId: user.jobPosition?.id ?? null,
      jobPositionCode: user.jobPosition?.code ?? null,
      jobPositionName: user.jobPosition?.name ?? null,
      processId: user.jobPosition?.process.id ?? null,
      processCode: user.jobPosition?.process.code ?? null,
      processName: user.jobPosition?.process.name ?? null,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
    };
  }

  private rethrowUniqueError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = Array.isArray(error.meta?.target)
        ? error.meta.target.map(String).join(', ')
        : 'usuario o correo';

      throw new ConflictException(`Ya existe un registro con el mismo ${target}`);
    }

    throw error;
  }
}
