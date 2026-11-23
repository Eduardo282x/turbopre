import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import type { AuthUser, CompleteTaskInput, TaskContext, TaskRecord } from '@turbopre/shared';
import { completeTaskInputSchema } from '@turbopre/shared';
import { JwtAuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { ApiMessage } from '../common/decorators/api-message.decorator.js';
import { TasksService } from './tasks.service.js';

@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('my')
  @ApiMessage('Mis tareas')
  my(@CurrentUser() actor: AuthUser): Promise<TaskContext[]> {
    return this.tasksService.my(actor);
  }

  @Post(':id/complete')
  @HttpCode(200)
  @ApiMessage('Tarea completada')
  complete(
    @Param('id') id: string,
    @Body({ schema: completeTaskInputSchema }) body: CompleteTaskInput,
    @CurrentUser() actor: AuthUser,
  ): Promise<TaskRecord> {
    return this.tasksService.complete(id, actor, body);
  }
}
