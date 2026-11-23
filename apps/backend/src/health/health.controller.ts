import { Controller, Get } from '@nestjs/common';
import type { HealthStatus } from '@turbopre/shared';
import { ApiMessage } from '../common/decorators/api-message.decorator.js';

export const API_VERSION = '0.1.0';

@Controller('health')
export class HealthController {
  @Get()
  @ApiMessage('Servicio disponible')
  check(): HealthStatus {
    return {
      status: 'ok',
      service: 'turbopre-api',
      version: API_VERSION,
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
