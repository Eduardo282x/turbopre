import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import type {
  AuthUser,
  ClientRecord,
  CreateClientInput,
  UpdateClientInput,
} from '@turbopre/shared';
import { createClientSchema, updateClientSchema } from '@turbopre/shared';
import { JwtAuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { ApiMessage } from '../common/decorators/api-message.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { ClientsService } from './clients.service.js';

@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @ApiMessage('Clientes')
  list(
    @Query('search') search?: string,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<ClientRecord[]> {
    return this.clientsService.list({
      search,
      includeInactive: includeInactive === 'true',
    });
  }

  @Get(':id')
  @ApiMessage('Cliente')
  get(@Param('id') id: string): Promise<ClientRecord> {
    return this.clientsService.get(id);
  }

  @Post()
  @Roles('ADMIN', 'SALES')
  @ApiMessage('Cliente creado')
  create(
    @Body({ schema: createClientSchema }) body: CreateClientInput,
    @CurrentUser() actor: AuthUser,
  ): Promise<ClientRecord> {
    return this.clientsService.create(body, actor.id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'SALES')
  @ApiMessage('Cliente actualizado')
  update(
    @Param('id') id: string,
    @Body({ schema: updateClientSchema }) body: UpdateClientInput,
    @CurrentUser() actor: AuthUser,
  ): Promise<ClientRecord> {
    return this.clientsService.update(id, body, actor.id);
  }
}
