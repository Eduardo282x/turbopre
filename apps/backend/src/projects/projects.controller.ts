import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import type {
  AuthUser,
  CreateProjectInput,
  ProjectRecord,
  UpdateProjectInput,
} from '@turbopre/shared';
import { createProjectSchema, updateProjectSchema } from '@turbopre/shared';
import { JwtAuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { ApiMessage } from '../common/decorators/api-message.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { ProjectsService } from './projects.service.js';

@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @Roles('ADMIN', 'ENGINEER', 'PROJECT_MANAGER')
  @ApiMessage('Proyectos')
  list(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('clientId') clientId?: string,
  ): Promise<ProjectRecord[]> {
    return this.projectsService.list({ search, status, clientId });
  }

  @Post()
  @Roles('ADMIN', 'ENGINEER')
  @ApiMessage('Proyecto creado')
  create(
    @Body({ schema: createProjectSchema }) body: CreateProjectInput,
    @CurrentUser() actor: AuthUser,
  ): Promise<ProjectRecord> {
    return this.projectsService.create(body, actor.id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'ENGINEER')
  @ApiMessage('Proyecto actualizado')
  update(
    @Param('id') id: string,
    @Body({ schema: updateProjectSchema }) body: UpdateProjectInput,
    @CurrentUser() actor: AuthUser,
  ): Promise<ProjectRecord> {
    return this.projectsService.update(id, body, actor.id);
  }
}
