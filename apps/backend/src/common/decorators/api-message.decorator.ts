import { SetMetadata } from '@nestjs/common';

/** Clave de metadata que lee el ResponseInterceptor. */
export const RESPONSE_MESSAGE_KEY = 'response_message';

/**
 * Personaliza el mensaje de éxito de una ruta.
 *
 * @example
 * @ApiMessage('Inicio de sesión exitoso')
 * @Post('login')
 */
export const ApiMessage = (message: string) => SetMetadata(RESPONSE_MESSAGE_KEY, message);
