import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type {
  AuthUser,
  CreateInspectionInput,
  CreateTaskInput,
  InspectionRecord,
  RejectInspectionInput,
  UpdateInspectionInput,
  UpdateTaskInput,
} from '@turbopre/shared';
import {
  createInspectionSchema,
  createTaskInputSchema,
  rejectInspectionSchema,
  updateInspectionSchema,
  updateTaskInputSchema,
} from '@turbopre/shared';
import { JwtAuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { ApiMessage } from '../common/decorators/api-message.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { InspectionsService } from './inspections.service.js';

@Controller('inspections')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InspectionsController {
  constructor(private readonly inspectionsService: InspectionsService) {}

  @Get()
  @ApiMessage('Inspecciones')
  list(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('serviceOrderId') serviceOrderId?: string,
  ): Promise<InspectionRecord[]> {
    return this.inspectionsService.list({ search, status, serviceOrderId });
  }

  @Get(':id')
  @ApiMessage('Inspección')
  get(@Param('id') id: string): Promise<InspectionRecord> {
    return this.inspectionsService.get(id);
  }

  @Post()
  @Roles('ADMIN', 'WORKSHOP')
  @ApiMessage('Inspección creada')
  create(
    @Body({ schema: createInspectionSchema }) body: CreateInspectionInput,
    @CurrentUser() actor: AuthUser,
  ): Promise<InspectionRecord> {
    return this.inspectionsService.create(body, actor);
  }

  @Patch(':id')
  @Roles('ADMIN', 'WORKSHOP')
  @ApiMessage('Inspección actualizada')
  update(
    @Param('id') id: string,
    @Body({ schema: updateInspectionSchema }) body: UpdateInspectionInput,
    @CurrentUser() actor: AuthUser,
  ): Promise<InspectionRecord> {
    return this.inspectionsService.update(id, body, actor);
  }

  @Post(':id/tasks')
  @Roles('ADMIN', 'WORKSHOP')
  @ApiMessage('Tarea de inspección creada')
  addTask(
    @Param('id') id: string,
    @Body({ schema: createTaskInputSchema }) body: CreateTaskInput,
    @CurrentUser() actor: AuthUser,
  ): Promise<InspectionRecord> {
    return this.inspectionsService.addTask(id, body, actor);
  }

  @Patch(':id/tasks/:taskId')
  @Roles('ADMIN', 'WORKSHOP')
  @ApiMessage('Tarea de inspección actualizada')
  updateTask(
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @Body({ schema: updateTaskInputSchema }) body: UpdateTaskInput,
    @CurrentUser() actor: AuthUser,
  ): Promise<InspectionRecord> {
    return this.inspectionsService.updateTask(id, taskId, body, actor);
  }

  @Delete(':id/tasks/:taskId')
  @Roles('ADMIN', 'WORKSHOP')
  @ApiMessage('Tarea de inspección eliminada')
  deleteTask(
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @CurrentUser() actor: AuthUser,
  ): Promise<InspectionRecord> {
    return this.inspectionsService.deleteTask(id, taskId, actor);
  }

  @Post(':id/approve')
  @HttpCode(200)
  @Roles('ADMIN', 'WORKSHOP')
  @ApiMessage('Inspección aprobada')
  approve(
    @Param('id') id: string,
    @CurrentUser() actor: AuthUser,
  ): Promise<InspectionRecord> {
    return this.inspectionsService.approve(id, actor);
  }

  @Post(':id/reject')
  @HttpCode(200)
  @Roles('ADMIN', 'WORKSHOP')
  @ApiMessage('Inspección rechazada')
  reject(
    @Param('id') id: string,
    @Body({ schema: rejectInspectionSchema }) body: RejectInspectionInput,
    @CurrentUser() actor: AuthUser,
  ): Promise<InspectionRecord> {
    return this.inspectionsService.reject(id, body, actor);
  }
}
