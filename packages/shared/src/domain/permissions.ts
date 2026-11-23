import type { UserRole } from '../auth.js';
import type { InspectionStatus, RouteSheetStatus, ServiceOrderStatus, TaskStatus } from './enums.js';

/**
 * Matriz única de permisos.
 *
 * El backend la usa en sus guards y servicios; el frontend la usa para mostrar
 * u ocultar acciones. Así la UI no puede ofrecer algo que la API rechaza.
 */

export interface PermissionUser {
  id: string;
  role: UserRole;
  jobPositionId?: string | null;
}

export interface PermissionTask {
  status: TaskStatus;
  assignedToId?: string | null;
  jobPositionId: string;
  blocked?: boolean;
}

const hasAnyRole = (role: UserRole, roles: readonly UserRole[]): boolean => roles.includes(role);

/** Roles que pueden ejecutar tareas de inspección/hoja de ruta. */
const TASK_ROLES: readonly UserRole[] = ['OPERATOR', 'ENGINEER', 'QUALITY'];

export function isAdmin(role: UserRole): boolean {
  return role === 'ADMIN';
}

export function canManageUsers(role: UserRole): boolean {
  return isAdmin(role);
}

export function canViewAudit(role: UserRole): boolean {
  return isAdmin(role);
}

export function canManageCatalogs(role: UserRole): boolean {
  return isAdmin(role);
}

export function canViewServiceOrders(role: UserRole): boolean {
  return hasAnyRole(role, ['ADMIN', 'SALES', 'WORKSHOP']);
}

export function canManageServiceOrders(role: UserRole): boolean {
  return hasAnyRole(role, ['ADMIN', 'SALES']);
}

export function canCreateServiceOrder(role: UserRole): boolean {
  return hasAnyRole(role, ['ADMIN', 'SALES']);
}

export function canManageClients(role: UserRole): boolean {
  return hasAnyRole(role, ['ADMIN', 'SALES']);
}

export function canViewClients(role: UserRole): boolean {
  return hasAnyRole(role, ['ADMIN', 'SALES', 'WORKSHOP', 'ENGINEER', 'PROJECT_MANAGER']);
}

export function canManageSites(role: UserRole): boolean {
  return hasAnyRole(role, ['ADMIN', 'SALES']);
}

export function canManageEquipment(role: UserRole): boolean {
  return hasAnyRole(role, ['ADMIN', 'SALES']);
}

export function canCreateInspection(role: UserRole): boolean {
  return hasAnyRole(role, ['ADMIN', 'WORKSHOP']);
}

export function canApproveInspection(role: UserRole): boolean {
  return hasAnyRole(role, ['ADMIN', 'WORKSHOP']);
}

export function canEditInspection(role: UserRole, status: InspectionStatus): boolean {
  if (!canCreateInspection(role)) return false;
  return status !== 'APPROVED' && status !== 'CANCELLED';
}

export function canViewInspections(role: UserRole): boolean {
  return hasAnyRole(role, ['ADMIN', 'WORKSHOP', 'ENGINEER']);
}

export function canManageRoutes(role: UserRole): boolean {
  return hasAnyRole(role, ['ADMIN', 'ENGINEER']);
}

export function canViewRouteSheets(role: UserRole): boolean {
  return hasAnyRole(role, ['ADMIN', 'SALES', 'WORKSHOP', 'ENGINEER', 'QUALITY', 'PROJECT_MANAGER']);
}

export function canViewRouteSheetDetail(role: UserRole): boolean {
  return role !== 'WAREHOUSE';
}

export function canEditRoute(role: UserRole, status: RouteSheetStatus): boolean {
  if (isAdmin(role)) return true;
  return (
    role === 'ENGINEER' &&
    (['DRAFT', 'PENDING_ANNEX_REVIEW', 'PENDING_QUALITY_APPROVAL'] as RouteSheetStatus[]).includes(
      status,
    )
  );
}

export function canSendRouteToApproval(role: UserRole, status: RouteSheetStatus): boolean {
  return canManageRoutes(role) && status === 'DRAFT';
}

export function canApproveRoute(role: UserRole, status: RouteSheetStatus): boolean {
  return hasAnyRole(role, ['ADMIN', 'PROJECT_MANAGER']) && status === 'PENDING_APPROVAL';
}

export function canFinalizeAnnexes(role: UserRole, status: RouteSheetStatus): boolean {
  return hasAnyRole(role, ['ADMIN', 'ENGINEER']) && status === 'PENDING_ANNEX_REVIEW';
}

export function canApproveQuality(role: UserRole, status: RouteSheetStatus): boolean {
  return hasAnyRole(role, ['ADMIN', 'QUALITY']) && status === 'PENDING_QUALITY_APPROVAL';
}

export function canDeliverServiceOrder(
  role: UserRole,
  status: ServiceOrderStatus,
): boolean {
  return hasAnyRole(role, ['ADMIN', 'SALES']) && status === 'READY_FOR_DELIVERY';
}

export function canCompleteTask(user: PermissionUser, task: PermissionTask): boolean {
  if (task.status === 'COMPLETED' || task.status === 'CANCELLED' || task.blocked) {
    return false;
  }

  if (isAdmin(user.role)) return true;
  if (!TASK_ROLES.includes(user.role)) return false;
  if (task.assignedToId) return task.assignedToId === user.id;
  return Boolean(user.jobPositionId) && user.jobPositionId === task.jobPositionId;
}

export function canRequestSparePart(role: UserRole): boolean {
  return hasAnyRole(role, ['ADMIN', 'WORKSHOP', 'ENGINEER', 'OPERATOR']);
}

export function canManageInventory(role: UserRole): boolean {
  return hasAnyRole(role, ['ADMIN', 'WAREHOUSE']);
}

export function canManageLoans(role: UserRole): boolean {
  return hasAnyRole(role, ['ADMIN', 'WAREHOUSE']);
}

export function canManageCalibration(role: UserRole): boolean {
  return hasAnyRole(role, ['ADMIN', 'WAREHOUSE']);
}

export function canManageProjects(role: UserRole): boolean {
  return hasAnyRole(role, ['ADMIN', 'ENGINEER']);
}

export function canViewProjects(role: UserRole): boolean {
  return hasAnyRole(role, ['ADMIN', 'ENGINEER', 'PROJECT_MANAGER']);
}

export function canViewPerformance(role: UserRole): boolean {
  return hasAnyRole(role, ['ADMIN', 'ENGINEER', 'PROJECT_MANAGER']);
}

export function canViewPlantMap(role: UserRole): boolean {
  return hasAnyRole(role, ['ADMIN', 'WORKSHOP', 'PROJECT_MANAGER']);
}

export function canViewHistory(role: UserRole): boolean {
  return hasAnyRole(role, ['ADMIN', 'SALES', 'ENGINEER', 'QUALITY', 'PROJECT_MANAGER']);
}

export function canViewApprovals(role: UserRole): boolean {
  return hasAnyRole(role, ['ADMIN', 'PROJECT_MANAGER']);
}
