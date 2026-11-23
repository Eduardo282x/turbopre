import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type {
  AuthUser,
  CreateUserInput,
  ResetPasswordInput,
  UpdateUserInput,
  UserListItem,
  UserOption,
} from '@turbopre/shared';
import {
  createUserSchema,
  resetPasswordSchema,
  updateUserSchema,
} from '@turbopre/shared';
import { JwtAuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { ApiMessage } from '../common/decorators/api-message.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { UsersService } from './users.service.js';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiMessage('Usuarios del sistema')
  list(@Query('search') search?: string): Promise<UserListItem[]> {
    return this.usersService.list(search);
  }

  @Get('options')
  @Roles('ADMIN', 'ENGINEER', 'PROJECT_MANAGER', 'WORKSHOP')
  @ApiMessage('Usuarios para asignación')
  options(@Query('roles') roles?: string): Promise<UserOption[]> {
    return this.usersService.options(roles?.split(','));
  }

  @Post()
  @ApiMessage('Usuario creado')
  create(
    @Body({ schema: createUserSchema }) body: CreateUserInput,
    @CurrentUser() actor: AuthUser,
  ): Promise<UserListItem> {
    return this.usersService.create(body, actor.id);
  }

  @Patch(':id')
  @ApiMessage('Usuario actualizado')
  update(
    @Param('id') id: string,
    @Body({ schema: updateUserSchema }) body: UpdateUserInput,
    @CurrentUser() actor: AuthUser,
  ): Promise<UserListItem> {
    return this.usersService.update(id, body, actor.id);
  }

  @Post(':id/password')
  @HttpCode(204)
  @ApiMessage('Contraseña actualizada')
  resetPassword(
    @Param('id') id: string,
    @Body({ schema: resetPasswordSchema }) body: ResetPasswordInput,
    @CurrentUser() actor: AuthUser,
  ): Promise<void> {
    return this.usersService.resetPassword(id, body, actor.id);
  }
}
