import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AuditModule } from './audit/audit.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CatalogsModule } from './catalogs/catalogs.module.js';
import { ClientsModule } from './clients/clients.module.js';
import { AllExceptionsFilter } from './common/filters/http.exception.filter.js';
import { EquipmentModule } from './equipment/equipment.module.js';
import { HealthModule } from './health/health.module.js';
import { ResponseInterceptor } from './interceptors/responde.interceptor.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProjectsModule } from './projects/projects.module.js';
import { ServiceOrdersModule } from './service-orders/service-orders.module.js';
import { SitesModule } from './sites/sites.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    AuditModule,
    HealthModule,
    AuthModule,
    UsersModule,
    CatalogsModule,
    ClientsModule,
    SitesModule,
    EquipmentModule,
    ProjectsModule,
    ServiceOrdersModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  ],
})
export class AppModule {}
