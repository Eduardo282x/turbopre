import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { JwtAuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';

const DEV_SECRET = 'turbopre-dev-secret-cambiar-en-produccion-32';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => ({
        secret: config.get<string>('JWT_SECRET') ?? DEV_SECRET,
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN') ?? '1d',
        } as JwtModuleOptions['signOptions'],
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [JwtAuthGuard, AuthService],
})
export class AuthModule {}
