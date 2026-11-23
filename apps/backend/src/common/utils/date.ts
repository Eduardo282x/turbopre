import { BadRequestException } from '@nestjs/common';

/** Convierte una fecha ISO del contrato a Date, respetando null/undefined. */
export function parseNullableDate(
  value: string | null | undefined,
): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException('La fecha enviada no es válida');
  }

  return date;
}
