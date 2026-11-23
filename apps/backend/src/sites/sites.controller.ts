import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import type {
  AuthUser,
  CreateSiteInput,
  SiteRecord,
  UpdateSiteInput,
} from '@turbopre/shared';
import { createSiteSchema, updateSiteSchema } from '@turbopre/shared';
import { JwtAuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { ApiMessage } from '../common/decorators/api-message.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { SitesService } from './sites.service.js';

@Controller('sites')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @Get()
  @ApiMessage('Sitios')
  list(
    @Query('clientId') clientId?: string,
    @Query('search') search?: string,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<SiteRecord[]> {
    return this.sitesService.list({
      clientId,
      search,
      includeInactive: includeInactive === 'true',
    });
  }

  @Post()
  @Roles('ADMIN', 'SALES')
  @ApiMessage('Sitio creado')
  create(
    @Body({ schema: createSiteSchema }) body: CreateSiteInput,
    @CurrentUser() actor: AuthUser,
  ): Promise<SiteRecord> {
    return this.sitesService.create(body, actor.id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'SALES')
  @ApiMessage('Sitio actualizado')
  update(
    @Param('id') id: string,
    @Body({ schema: updateSiteSchema }) body: UpdateSiteInput,
    @CurrentUser() actor: AuthUser,
  ): Promise<SiteRecord> {
    return this.sitesService.update(id, body, actor.id);
  }
}
