/**
 * En desarrollo/QA se habilitan los accesos rápidos y el cambio de usuario.
 * En producción el login es real y el administrador crea las cuentas.
 *
 * Para forzar el modo demo en un build de QA:
 *   VITE_PREVIEW=true pnpm --filter frontend build
 */
export const isPreviewMode =
  import.meta.env.DEV || (import.meta.env.VITE_PREVIEW as string | undefined) === 'true';
