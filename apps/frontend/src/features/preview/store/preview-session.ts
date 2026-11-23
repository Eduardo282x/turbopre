import type { AuthUser } from '@turbopre/shared';
import { useMemo } from 'react';
import { useAuthStore } from '@/stores/use-auth-store';
import type { PositionId, User } from '../types';
import { usePreviewStore } from './preview-store';

/**
 * Traduce los códigos de puesto del backend a los IDs del modelo preview.
 * Es un puente temporal: desaparece cuando todos los módulos consuman la API.
 */
const JOB_POSITION_TO_PREVIEW_POSITION: Record<string, PositionId> = {
  ROTATING_SPECIALIST: 'rotating_specialist',
  MECHANIC_I: 'rotating_mechanic_1',
  MECHANIC_II: 'rotating_mechanic_2',
  LIFTING_OPERATOR: 'lifting_operator',
  ABRASIVE_CLEANER: 'abrasive_operator',
  WINDER_I: 'winder_1',
  WINDER_II: 'winder_2',
  WELDER_FI: 'welder_fi',
  WELDER_I: 'welder_1',
  WELDER_II: 'welder_2',
  MACHINE_OPERATOR_I: 'machine_operator_1',
  MACHINE_OPERATOR_II: 'machine_operator_2',
  DEBURRER: 'deburrer',
  DRAWING_ENGINEER: 'eng_plans',
  PMI_INSPECTOR: 'eng_pmi',
  SAMPLE_CUTTING_TECHNICIAN: 'eng_sample_cut',
  METALLOGRAPHY_ANALYST: 'eng_metallography',
  QUALITY_INSPECTOR: 'quality_inspector',
};

export function mapJobPositionCodeToPositionId(
  code?: string | null,
): PositionId | undefined {
  return code ? JOB_POSITION_TO_PREVIEW_POSITION[code] : undefined;
}

export function authUserToPreviewUser(authUser: AuthUser): User {
  return {
    id: authUser.id,
    name: authUser.name,
    username: authUser.username,
    password: '',
    email: authUser.email ?? '',
    role: authUser.role,
    positionId: mapJobPositionCodeToPositionId(authUser.jobPositionCode),
    active: true,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Usuario de la sesión real.
 *
 * Mientras queden módulos en modo preview, si el usuario autenticado coincide
 * con la semilla (IDs estables) se devuelve ese usuario para que las tareas y
 * asignaciones del preview sigan cuadrando. Para cuentas nuevas se construye
 * un usuario compatible a partir del JWT.
 */
export function useCurrentUser(): User | null {
  const accessToken = useAuthStore((state) => state.accessToken);
  const authUser = useAuthStore((state) => state.user);
  const previewUser = usePreviewStore((state) =>
    authUser ? state.db.users.find((user) => user.id === authUser.id) : undefined,
  );

  return useMemo(() => {
    if (!accessToken || !authUser) return null;
    return previewUser ?? authUserToPreviewUser(authUser);
  }, [accessToken, authUser, previewUser]);
}
