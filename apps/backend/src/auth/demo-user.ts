import type { AuthUser } from '@turbopre/shared';

/** Usuario de demostración: permite probar el login sin base de datos. */
export const DEMO_USER: AuthUser = {
  id: 'demo-admin',
  name: 'Administrador',
  email: 'admin@turbopre.dev',
  role: 'ADMIN',
};

/** Hash bcrypt de la contraseña `Admin123!`. */
export const DEMO_PASSWORD_HASH = '$2b$10$wct5Rb9IFXgHDsC2qBmoLe90ime1HQpUSMoqByVTJRkZduW/issEG';
