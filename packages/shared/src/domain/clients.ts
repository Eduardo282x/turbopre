import { z } from 'zod';

const optionalText = (max = 250) =>
  z
    .union([z.literal(''), z.string().trim().max(max)])
    .transform((value) => (value === '' ? null : value))
    .nullable()
    .optional();

const optionalEmail = z
  .union([z.literal(''), z.email('El correo no es válido')])
  .transform((value) => (value === '' ? null : value))
  .nullable()
  .optional();

export const clientCodeSchema = z
  .string()
  .trim()
  .min(2, 'El código debe tener al menos 2 caracteres')
  .max(20, 'El código es demasiado largo')
  .regex(/^[a-zA-Z0-9._-]+$/, 'Solo se permiten letras, números, punto, guion y guion bajo')
  .transform((value) => value.toUpperCase());

export const clientRecordSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  taxId: z.string().nullable(),
  contactName: z.string().nullable(),
  contactEmail: z.email().nullable(),
  contactPhone: z.string().nullable(),
  address: z.string().nullable(),
  isActive: z.boolean(),
  siteCount: z.number().int(),
  equipmentCount: z.number().int(),
  serviceOrderCount: z.number().int(),
  activeServiceOrderCount: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ClientRecord = z.infer<typeof clientRecordSchema>;

export const createClientSchema = z.object({
  code: clientCodeSchema,
  name: z.string().trim().min(2, 'El nombre es obligatorio').max(160),
  taxId: optionalText(40),
  contactName: optionalText(120),
  contactEmail: optionalEmail,
  contactPhone: optionalText(40),
  address: optionalText(250),
});
export type CreateClientInput = z.infer<typeof createClientSchema>;

export const updateClientSchema = z
  .object({
    code: clientCodeSchema.optional(),
    name: z.string().trim().min(2).max(160).optional(),
    taxId: optionalText(40),
    contactName: optionalText(120),
    contactEmail: optionalEmail,
    contactPhone: optionalText(40),
    address: optionalText(250),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: 'Envía al menos un campo para actualizar',
  });
export type UpdateClientInput = z.infer<typeof updateClientSchema>;

export const clientQuerySchema = z.object({
  search: z.string().trim().optional(),
  includeInactive: z.coerce.boolean().optional(),
});

export const siteRecordSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  clientName: z.string(),
  name: z.string(),
  address: z.string().nullable(),
  isActive: z.boolean(),
  serviceOrderCount: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type SiteRecord = z.infer<typeof siteRecordSchema>;

export const createSiteSchema = z.object({
  clientId: z.string().trim().min(1, 'Selecciona un cliente'),
  name: z.string().trim().min(2, 'El nombre del sitio es obligatorio').max(160),
  address: optionalText(250),
});
export type CreateSiteInput = z.infer<typeof createSiteSchema>;

export const updateSiteSchema = z
  .object({
    name: z.string().trim().min(2).max(160).optional(),
    address: optionalText(250),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: 'Envía al menos un campo para actualizar',
  });
export type UpdateSiteInput = z.infer<typeof updateSiteSchema>;

export const equipmentTypeSchema = z.enum([
  'GAS_TURBINE',
  'STEAM_TURBINE',
  'GENERATOR',
  'COMPRESSOR',
  'AUXILIARY',
]);
export type EquipmentType = z.infer<typeof equipmentTypeSchema>;
export const EQUIPMENT_TYPES = equipmentTypeSchema.options;

export const equipmentRecordSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  clientName: z.string(),
  code: z.string(),
  name: z.string(),
  serialNumber: z.string().nullable(),
  manufacturer: z.string().nullable(),
  model: z.string().nullable(),
  type: equipmentTypeSchema,
  notes: z.string().nullable(),
  isActive: z.boolean(),
  serviceOrderCount: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type EquipmentRecord = z.infer<typeof equipmentRecordSchema>;

export const createEquipmentSchema = z.object({
  clientId: z.string().trim().min(1, 'Selecciona un cliente'),
  code: z.string().trim().min(1, 'El código/tag es obligatorio').max(60),
  name: z.string().trim().min(2, 'El nombre del equipo es obligatorio').max(160),
  type: equipmentTypeSchema.default('AUXILIARY'),
  serialNumber: optionalText(80),
  manufacturer: optionalText(120),
  model: optionalText(120),
  notes: optionalText(500),
});
export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;

export const updateEquipmentSchema = z
  .object({
    code: z.string().trim().min(1).max(60).optional(),
    name: z.string().trim().min(2).max(160).optional(),
    type: equipmentTypeSchema.optional(),
    serialNumber: optionalText(80),
    manufacturer: optionalText(120),
    model: optionalText(120),
    notes: optionalText(500),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: 'Envía al menos un campo para actualizar',
  });
export type UpdateEquipmentInput = z.infer<typeof updateEquipmentSchema>;

export const equipmentQuerySchema = z.object({
  clientId: z.string().trim().optional(),
  search: z.string().trim().optional(),
  includeInactive: z.coerce.boolean().optional(),
});

export const siteQuerySchema = z.object({
  clientId: z.string().trim().optional(),
  search: z.string().trim().optional(),
  includeInactive: z.coerce.boolean().optional(),
});
