import axios from 'axios';
import type { ApiError } from '@turbopre/shared';

/** Traduce un error de Axios al mensaje que devuelve la API. */
export function getApiErrorMessage(error: unknown, fallback = 'Ocurrió un error inesperado'): string {
  if (axios.isAxiosError<ApiError>(error)) {
    if (!error.response) {
      return 'No se pudo conectar con el servidor. Verifica que la API esté en marcha.';
    }

    const { message } = error.response.data;

    if (Array.isArray(message)) {
      return message.join(', ');
    }

    if (message) {
      return message;
    }
  }

  return fallback;
}
