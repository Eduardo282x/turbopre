import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { RouteSheetsController } from './route-sheets.controller.js';
import { RouteSheetsService } from './route-sheets.service.js';

@Module({
  imports: [AuthModule],
  controllers: [RouteSheetsController],
  providers: [RouteSheetsService],
  exports: [RouteSheetsService],
})
export class RouteSheetsModule {}
