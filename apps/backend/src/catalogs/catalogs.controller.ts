import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import type {
  AuthUser,
  CatalogJobPosition,
  CatalogPlantLocation,
  CatalogProcess,
  CreateDepartmentInput,
  CreateJobPositionInput,
  CreatePlantLocationInput,
  CreateProcessInput,
  Department,
  OrganizationCatalog,
  UpdateDepartmentInput,
  UpdateJobPositionInput,
  UpdatePlantLocationInput,
  UpdateProcessInput,
} from '@turbopre/shared';
import {
  createDepartmentSchema,
  createJobPositionSchema,
  createPlantLocationSchema,
  createProcessSchema,
  updateDepartmentSchema,
  updateJobPositionSchema,
  updatePlantLocationSchema,
  updateProcessSchema,
} from '@turbopre/shared';
import { JwtAuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { ApiMessage } from '../common/decorators/api-message.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CatalogsService } from './catalogs.service.js';

@Controller('catalogs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CatalogsController {
  constructor(private readonly catalogsService: CatalogsService) {}

  @Get()
  @ApiMessage('Catálogos de organización')
  getOrganization(): Promise<OrganizationCatalog> {
    return this.catalogsService.getOrganization();
  }

  @Post('departments')
  @Roles('ADMIN')
  @ApiMessage('Departamento creado')
  createDepartment(
    @Body({ schema: createDepartmentSchema }) body: CreateDepartmentInput,
    @CurrentUser() actor: AuthUser,
  ): Promise<Department> {
    return this.catalogsService.createDepartment(body, actor.id);
  }

  @Patch('departments/:id')
  @Roles('ADMIN')
  @ApiMessage('Departamento actualizado')
  updateDepartment(
    @Param('id') id: string,
    @Body({ schema: updateDepartmentSchema }) body: UpdateDepartmentInput,
    @CurrentUser() actor: AuthUser,
  ): Promise<Department> {
    return this.catalogsService.updateDepartment(id, body, actor.id);
  }

  @Post('processes')
  @Roles('ADMIN')
  @ApiMessage('Proceso creado')
  createProcess(
    @Body({ schema: createProcessSchema }) body: CreateProcessInput,
    @CurrentUser() actor: AuthUser,
  ): Promise<CatalogProcess> {
    return this.catalogsService.createProcess(body, actor.id);
  }

  @Patch('processes/:id')
  @Roles('ADMIN')
  @ApiMessage('Proceso actualizado')
  updateProcess(
    @Param('id') id: string,
    @Body({ schema: updateProcessSchema }) body: UpdateProcessInput,
    @CurrentUser() actor: AuthUser,
  ): Promise<CatalogProcess> {
    return this.catalogsService.updateProcess(id, body, actor.id);
  }

  @Post('job-positions')
  @Roles('ADMIN')
  @ApiMessage('Puesto de trabajo creado')
  createJobPosition(
    @Body({ schema: createJobPositionSchema }) body: CreateJobPositionInput,
    @CurrentUser() actor: AuthUser,
  ): Promise<CatalogJobPosition> {
    return this.catalogsService.createJobPosition(body, actor.id);
  }

  @Patch('job-positions/:id')
  @Roles('ADMIN')
  @ApiMessage('Puesto de trabajo actualizado')
  updateJobPosition(
    @Param('id') id: string,
    @Body({ schema: updateJobPositionSchema }) body: UpdateJobPositionInput,
    @CurrentUser() actor: AuthUser,
  ): Promise<CatalogJobPosition> {
    return this.catalogsService.updateJobPosition(id, body, actor.id);
  }

  @Post('plant-locations')
  @Roles('ADMIN')
  @ApiMessage('Ubicación de planta creada')
  createPlantLocation(
    @Body({ schema: createPlantLocationSchema }) body: CreatePlantLocationInput,
    @CurrentUser() actor: AuthUser,
  ): Promise<CatalogPlantLocation> {
    return this.catalogsService.createPlantLocation(body, actor.id);
  }

  @Patch('plant-locations/:id')
  @Roles('ADMIN')
  @ApiMessage('Ubicación de planta actualizada')
  updatePlantLocation(
    @Param('id') id: string,
    @Body({ schema: updatePlantLocationSchema }) body: UpdatePlantLocationInput,
    @CurrentUser() actor: AuthUser,
  ): Promise<CatalogPlantLocation> {
    return this.catalogsService.updatePlantLocation(id, body, actor.id);
  }
}
