import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import type {
  AnnexSelectionInput,
  AuthUser,
  CreateRouteSheetInput,
  CreateTaskInput,
  ReplaceRouteTasksInput,
  RouteSheetCommentInput,
  RouteSheetRecord,
  RouteSheetRejectInput,
  UpdateRouteSheetInput,
} from '@turbopre/shared';
import {
  annexSelectionSchema,
  createRouteSheetSchema,
  createTaskInputSchema,
  replaceRouteTasksSchema,
  routeSheetCommentSchema,
  routeSheetRejectSchema,
  updateRouteSheetSchema,
} from '@turbopre/shared';
import { JwtAuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { ApiMessage } from '../common/decorators/api-message.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { RouteSheetsService } from './route-sheets.service.js';

@Controller('route-sheets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RouteSheetsController {
  constructor(private readonly routeSheetsService: RouteSheetsService) {}

  @Get()
  @ApiMessage('Hojas de ruta')
  list(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('serviceOrderId') serviceOrderId?: string,
  ): Promise<RouteSheetRecord[]> {
    return this.routeSheetsService.list({ search, status, serviceOrderId });
  }

  @Get(':id')
  @ApiMessage('Hoja de ruta')
  get(@Param('id') id: string): Promise<RouteSheetRecord> {
    return this.routeSheetsService.get(id);
  }

  @Post()
  @Roles('ADMIN', 'ENGINEER')
  @ApiMessage('Hoja de ruta creada')
  create(
    @Body({ schema: createRouteSheetSchema }) body: CreateRouteSheetInput,
    @CurrentUser() actor: AuthUser,
  ): Promise<RouteSheetRecord> {
    return this.routeSheetsService.create(body, actor);
  }

  @Patch(':id')
  @Roles('ADMIN', 'ENGINEER')
  @ApiMessage('Hoja de ruta actualizada')
  update(
    @Param('id') id: string,
    @Body({ schema: updateRouteSheetSchema }) body: UpdateRouteSheetInput,
    @CurrentUser() actor: AuthUser,
  ): Promise<RouteSheetRecord> {
    return this.routeSheetsService.update(id, body, actor);
  }

  @Put(':id/tasks')
  @Roles('ADMIN', 'ENGINEER')
  @ApiMessage('Tareas de la hoja reemplazadas')
  replaceTasks(
    @Param('id') id: string,
    @Body({ schema: replaceRouteTasksSchema }) body: ReplaceRouteTasksInput,
    @CurrentUser() actor: AuthUser,
  ): Promise<RouteSheetRecord> {
    return this.routeSheetsService.replaceTasks(id, body, actor);
  }

  @Post(':id/tasks')
  @Roles('ADMIN', 'ENGINEER')
  @ApiMessage('Tarea de hoja de ruta creada')
  addTask(
    @Param('id') id: string,
    @Body({ schema: createTaskInputSchema }) body: CreateTaskInput,
    @CurrentUser() actor: AuthUser,
  ): Promise<RouteSheetRecord> {
    return this.routeSheetsService.addTask(id, body, actor);
  }

  @Post(':id/submit')
  @HttpCode(200)
  @Roles('ADMIN', 'ENGINEER')
  @ApiMessage('Hoja enviada a aprobación')
  submit(
    @Param('id') id: string,
    @CurrentUser() actor: AuthUser,
  ): Promise<RouteSheetRecord> {
    return this.routeSheetsService.submit(id, actor);
  }

  @Post(':id/approve')
  @HttpCode(200)
  @Roles('ADMIN', 'PROJECT_MANAGER')
  @ApiMessage('Hoja aprobada y liberada')
  approve(
    @Param('id') id: string,
    @Body({ schema: routeSheetCommentSchema }) body: RouteSheetCommentInput,
    @CurrentUser() actor: AuthUser,
  ): Promise<RouteSheetRecord> {
    return this.routeSheetsService.approve(id, body, actor);
  }

  @Post(':id/reject')
  @HttpCode(200)
  @Roles('ADMIN', 'PROJECT_MANAGER')
  @ApiMessage('Hoja devuelta a Ingeniería')
  reject(
    @Param('id') id: string,
    @Body({ schema: routeSheetRejectSchema }) body: RouteSheetRejectInput,
    @CurrentUser() actor: AuthUser,
  ): Promise<RouteSheetRecord> {
    return this.routeSheetsService.reject(id, body, actor);
  }

  @Post(':id/finalize-annexes')
  @HttpCode(200)
  @Roles('ADMIN', 'ENGINEER')
  @ApiMessage('Anexos finalizados')
  finalizeAnnexes(
    @Param('id') id: string,
    @Body({ schema: routeSheetCommentSchema }) body: RouteSheetCommentInput,
    @CurrentUser() actor: AuthUser,
  ): Promise<RouteSheetRecord> {
    return this.routeSheetsService.finalizeAnnexes(id, body, actor);
  }

  @Post(':id/request-annex-changes')
  @HttpCode(200)
  @Roles('ADMIN', 'ENGINEER')
  @ApiMessage('Anexos devueltos a ejecución')
  requestAnnexChanges(
    @Param('id') id: string,
    @Body({ schema: routeSheetRejectSchema }) body: RouteSheetRejectInput,
    @CurrentUser() actor: AuthUser,
  ): Promise<RouteSheetRecord> {
    return this.routeSheetsService.requestAnnexChanges(id, body, actor);
  }

  @Post(':id/approve-quality')
  @HttpCode(200)
  @Roles('ADMIN', 'QUALITY')
  @ApiMessage('Visto bueno de Calidad registrado')
  approveQuality(
    @Param('id') id: string,
    @Body({ schema: routeSheetCommentSchema }) body: RouteSheetCommentInput,
    @CurrentUser() actor: AuthUser,
  ): Promise<RouteSheetRecord> {
    return this.routeSheetsService.approveQuality(id, body, actor);
  }

  @Post(':id/reject-quality')
  @HttpCode(200)
  @Roles('ADMIN', 'QUALITY')
  @ApiMessage('Hoja rechazada por Calidad')
  rejectQuality(
    @Param('id') id: string,
    @Body({ schema: routeSheetRejectSchema }) body: RouteSheetRejectInput,
    @CurrentUser() actor: AuthUser,
  ): Promise<RouteSheetRecord> {
    return this.routeSheetsService.rejectQuality(id, body, actor);
  }

  @Patch(':id/tasks/:taskId/annex')
  @Roles('ADMIN', 'ENGINEER')
  @ApiMessage('Anexo actualizado')
  toggleAnnex(
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @Body({ schema: annexSelectionSchema }) body: AnnexSelectionInput,
    @CurrentUser() actor: AuthUser,
  ): Promise<RouteSheetRecord> {
    return this.routeSheetsService.toggleAnnex(id, taskId, body.selected, actor);
  }
}
