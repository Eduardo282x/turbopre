import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CatalogsController } from './catalogs.controller.js';
import { CatalogsService } from './catalogs.service.js';

@Module({
  imports: [AuthModule],
  controllers: [CatalogsController],
  providers: [CatalogsService],
})
export class CatalogsModule {}
