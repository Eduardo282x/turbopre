import {
  Body,
  Controller,
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
  CreateServiceOrderInput,
  DeliverServiceOrderInput,
  ServiceOrderRecord,
  UpdateServiceOrderInput,
} from '@turbopre/shared';
import {
  createServiceOrderSchema,
  deliverServiceOrderSchema,
  updateServiceOrderSchema,
} from '@turbopre/shared';
import { JwtAuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { ApiMessage } from '../common/decorators/api-message.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { ServiceOrdersService } from './service-orders.service.js';

@Controller('service-orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServiceOrdersController {
  constructor(private readonly serviceOrdersService: ServiceOrdersService) {}

  @Get()
  @ApiMessage('Órdenes de servicio')
  list(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('clientId') clientId?: string,
    @Query('priority') priority?: string,
  ): Promise<ServiceOrderRecord[]> {
    return this.serviceOrdersService.list({ search, status, clientId, priority });
  }

  @Get(':id')
  @ApiMessage('Orden de servicio')
  get(@Param('id') id: string): Promise<ServiceOrderRecord> {
    return this.serviceOrdersService.get(id);
  }

  @Post()
  @Roles('ADMIN', 'SALES')
  @ApiMessage('Orden de servicio creada')
  create(
    @Body({ schema: createServiceOrderSchema }) body: CreateServiceOrderInput,
    @CurrentUser() actor: AuthUser,
  ): Promise<ServiceOrderRecord> {
    return this.serviceOrdersService.create(body, actor);
  }

  @Patch(':id')
  @Roles('ADMIN', 'SALES')
  @ApiMessage('Orden de servicio actualizada')
  update(
    @Param('id') id: string,
    @Body({ schema: updateServiceOrderSchema }) body: UpdateServiceOrderInput,
    @CurrentUser() actor: AuthUser,
  ): Promise<ServiceOrderRecord> {
    return this.serviceOrdersService.update(id, body, actor);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  @Roles('ADMIN', 'SALES')
  @ApiMessage('Orden de servicio cancelada')
  cancel(
    @Param('id') id: string,
    @CurrentUser() actor: AuthUser,
  ): Promise<ServiceOrderRecord> {
    return this.serviceOrdersService.cancel(id, actor);
  }

  @Post(':id/deliver')
  @HttpCode(200)
  @Roles('ADMIN', 'SALES')
  @ApiMessage('Orden de servicio entregada')
  deliver(
    @Param('id') id: string,
    @Body({ schema: deliverServiceOrderSchema }) body: DeliverServiceOrderInput,
    @CurrentUser() actor: AuthUser,
  ): Promise<ServiceOrderRecord> {
    return this.serviceOrdersService.deliver(id, actor, body.notes);
  }
}
