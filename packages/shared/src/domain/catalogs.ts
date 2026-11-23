import { z } from 'zod';
import { processKindSchema } from './enums.js';

export const departmentSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  isActive: z.boolean(),
});
export type Department = z.infer<typeof departmentSchema>;

export const catalogProcessSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  kind: processKindSchema,
  departmentId: z.string(),
  departmentName: z.string(),
  isActive: z.boolean(),
});
export type CatalogProcess = z.infer<typeof catalogProcessSchema>;

export const catalogJobPositionSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  processId: z.string(),
  processCode: z.string(),
  processName: z.string(),
  processKind: processKindSchema,
  departmentId: z.string(),
  departmentName: z.string(),
  isActive: z.boolean(),
});
export type CatalogJobPosition = z.infer<typeof catalogJobPositionSchema>;

export const catalogPlantLocationSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  processId: z.string().nullable(),
  processName: z.string().nullable(),
  isActive: z.boolean(),
});
export type CatalogPlantLocation = z.infer<typeof catalogPlantLocationSchema>;

/** Catálogos que necesita el frontend para formularios de usuarios y ODS. */
export const organizationCatalogSchema = z.object({
  departments: z.array(departmentSchema),
  processes: z.array(catalogProcessSchema),
  jobPositions: z.array(catalogJobPositionSchema),
  plantLocations: z.array(catalogPlantLocationSchema),
});
export type OrganizationCatalog = z.infer<typeof organizationCatalogSchema>;

export const createDepartmentSchema = z.object({
  code: z.string().trim().min(2).max(40),
  name: z.string().trim().min(2).max(120),
});
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;

export const updateDepartmentSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;

export const createProcessSchema = z.object({
  departmentId: z.string().trim().min(1),
  code: z.string().trim().min(2).max(40),
  name: z.string().trim().min(2).max(120),
  kind: processKindSchema.default('WORKSHOP'),
});
export type CreateProcessInput = z.infer<typeof createProcessSchema>;

export const updateProcessSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  kind: processKindSchema.optional(),
  isActive: z.boolean().optional(),
});
export type UpdateProcessInput = z.infer<typeof updateProcessSchema>;

export const createJobPositionSchema = z.object({
  processId: z.string().trim().min(1),
  code: z.string().trim().min(2).max(40),
  name: z.string().trim().min(2).max(120),
});
export type CreateJobPositionInput = z.infer<typeof createJobPositionSchema>;

export const updateJobPositionSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateJobPositionInput = z.infer<typeof updateJobPositionSchema>;

export const createPlantLocationSchema = z.object({
  code: z.string().trim().min(2).max(40),
  name: z.string().trim().min(2).max(120),
  processId: z.string().trim().min(1).nullable().optional(),
  mapX: z.number().nullable().optional(),
  mapY: z.number().nullable().optional(),
});
export type CreatePlantLocationInput = z.infer<typeof createPlantLocationSchema>;

export const updatePlantLocationSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  processId: z.string().trim().min(1).nullable().optional(),
  mapX: z.number().nullable().optional(),
  mapY: z.number().nullable().optional(),
  isActive: z.boolean().optional(),
});
export type UpdatePlantLocationInput = z.infer<typeof updatePlantLocationSchema>;
