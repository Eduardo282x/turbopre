import type { RouteSheetStatus } from '@turbopre/shared';
import type { RouteStatus } from '@/features/preview/types';

/**
 * Traduce el estado de la hoja de ruta del preview al estado canónico del
 * backend. Es un puente temporal hasta que la Fase 4 conecte las hojas.
 */
export function previewRouteStatusToApi(status: RouteStatus): RouteSheetStatus {
  switch (status) {
    case 'DRAFT':
      return 'DRAFT';
    case 'PENDING_APPROVAL':
      return 'PENDING_APPROVAL';
    case 'APPROVED':
      return 'RELEASED';
    case 'IN_PROGRESS':
      return 'IN_PROGRESS';
    case 'IN_ANNEXES':
      return 'PENDING_ANNEX_REVIEW';
    case 'IN_QUALITY':
      return 'PENDING_QUALITY_APPROVAL';
    case 'READY_FOR_DELIVERY':
    case 'DELIVERED':
      return 'COMPLETED';
  }
}
