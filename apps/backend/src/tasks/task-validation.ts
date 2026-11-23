import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

/** Valida que el puesto exista y que el usuario asignado pertenezca a él. */
export async function validateTaskAssignment(
  prisma: PrismaService,
  jobPositionId: string,
  assignedToId: string | null,
): Promise<void> {
  const position = await prisma.jobPosition.findUnique({
    where: { id: jobPositionId },
  });

  if (!position || !position.isActive) {
    throw new BadRequestException('El puesto de trabajo no existe o está inactivo');
  }

  if (!assignedToId) {
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: assignedToId } });

  if (!user || !user.isActive) {
    throw new BadRequestException('El usuario asignado no existe o está inactivo');
  }

  if (user.jobPositionId !== jobPositionId) {
    throw new BadRequestException(
      'El usuario asignado no pertenece al puesto de trabajo de la tarea',
    );
  }
}
