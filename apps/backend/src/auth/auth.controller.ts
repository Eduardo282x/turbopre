import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import type { AuthUser, LoginInput, LoginResponse } from '@turbopre/shared';
import { loginSchema } from '@turbopre/shared';
import { ApiMessage } from '../common/decorators/api-message.decorator.js';
import { JwtAuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import { CurrentUser } from './current-user.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @ApiMessage('Inicio de sesión exitoso')
  login(@Body({ schema: loginSchema }) body: LoginInput): Promise<LoginResponse> {
    return this.authService.login(body);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiMessage('Usuario autenticado')
  me(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }
}
