import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import type {
  AuthUser,
  CreateEquipmentInput,
  EquipmentRecord,
  UpdateEquipmentInput,
} from '@turbopre/shared';
import { createEquipmentSchema, updateEquipmentSchema } from '@turbopre/shared';
import { JwtAuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { ApiMessage } from '../common/decorators/api-message.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { EquipmentService } from './equipment.service.js';

@Controller('equipment')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Get()
  @ApiMessage('Equipos')
  list(
    @Query('clientId') clientId?: string,
    @Query('search') search?: string,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<EquipmentRecord[]> {
    return this.equipmentService.list({
      clientId,
      search,
      includeInactive: includeInactive === 'true',
    });
  }

  @Post()
  @Roles('ADMIN', 'SALES')
  @ApiMessage('Equipo creado')
  create(
    @Body({ schema: createEquipmentSchema }) body: CreateEquipmentInput,
    @CurrentUser() actor: AuthUser,
  ): Promise<EquipmentRecord> {
    return this.equipmentService.create(body, actor.id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'SALES')
  @ApiMessage('Equipo actualizado')
  update(
    @Param('id') id: string,
    @Body({ schema: updateEquipmentSchema }) body: UpdateEquipmentInput,
    @CurrentUser() actor: AuthUser,
  ): Promise<EquipmentRecord> {
    return this.equipmentService.update(id, body, actor.id);
  }
}
