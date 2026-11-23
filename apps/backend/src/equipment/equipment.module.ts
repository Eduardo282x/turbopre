import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { EquipmentController } from './equipment.controller.js';
import { EquipmentService } from './equipment.service.js';

@Module({
  imports: [AuthModule],
  controllers: [EquipmentController],
  providers: [EquipmentService],
  exports: [EquipmentService],
})
export class EquipmentModule {}
