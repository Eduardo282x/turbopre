import {
  canManageCalibration as canManageCalibrationByRole,
  canManageInventory as canManageInventoryByRole,
  canManageLoans as canManageLoansByRole,
  canManageProjects as canManageProjectsByRole,
  canManageRoutes as canManageRoutesByRole,
  canManageServiceOrders as canManageServiceOrdersByRole,
  canManageUsers as canManageUsersByRole,
  canCreateInspection as canCreateInspectionByRole,
  canApproveInspection as canApproveInspectionByRole,
  canEditInspection as canEditInspectionByRole,
  canRequestSparePart as canRequestSparePartByRole,
  canViewAudit as canViewAuditByRole,
  canViewPerformance as canViewPerformanceByRole,
  canViewPlantMap as canViewPlantMapByRole,
  isAdmin,
} from '@turbopre/shared';
import type { Inspection, RouteSheet, Task, User } from '@/features/preview/types';

/**
 * Adaptadores del modelo preview sobre la matriz de permisos compartida.
 * Las reglas de rol viven en `@turbopre/shared`; aquí solo se adaptan los tipos
 * provisionales del frontend. Las reglas que dependen de estados del preview
 * se migran en la fase de la hoja de ruta.
 */

export function isGlobal(user: User): boolean {
  return isAdmin(user.role);
}

export function canManageUsers(user: User): boolean {
  return canManageUsersByRole(user.role);
}

export function canViewAudit(user: User): boolean {
  return canViewAuditByRole(user.role);
}

export function canManageServiceOrders(user: User): boolean {
  return canManageServiceOrdersByRole(user.role);
}

export function canCreateInspection(user: User): boolean {
  return canCreateInspectionByRole(user.role);
}

export function canApproveInspection(user: User): boolean {
  return canApproveInspectionByRole(user.role);
}

export function canEditInspection(user: User, inspection: Inspection): boolean {
  return canEditInspectionByRole(user.role, inspection.status);
}

export function canManageRoutes(user: User): boolean {
  return canManageRoutesByRole(user.role);
}

export function canEditRoute(user: User, route: RouteSheet): boolean {
  if (isGlobal(user)) return true;
  return user.role === 'ENGINEER' && ['DRAFT', 'IN_ANNEXES', 'IN_QUALITY'].includes(route.status);
}

export function canSendRouteToApproval(user: User, route: RouteSheet): boolean {
  return ['ADMIN', 'ENGINEER'].includes(user.role) && route.status === 'DRAFT';
}

export function canApproveRoute(user: User, route: RouteSheet): boolean {
  return ['ADMIN', 'PROJECT_MANAGER'].includes(user.role) && route.status === 'PENDING_APPROVAL';
}

export function canFinalizeAnnexes(user: User, route: RouteSheet): boolean {
  return ['ADMIN', 'ENGINEER'].includes(user.role) && route.status === 'IN_ANNEXES';
}

export function canApproveQuality(user: User, route: RouteSheet): boolean {
  return ['ADMIN', 'QUALITY'].includes(user.role) && route.status === 'IN_QUALITY';
}

export function canDeliverRoute(user: User, route: RouteSheet): boolean {
  return ['ADMIN', 'SALES'].includes(user.role) && route.status === 'READY_FOR_DELIVERY';
}

export function canCompleteTask(user: User, task: Task): boolean {
  if (task.status === 'COMPLETED' || task.status === 'BLOCKED') return false;
  if (isGlobal(user)) return true;
  if (task.assignedUserId) return task.assignedUserId === user.id;
  return Boolean(user.positionId) && user.positionId === task.positionId;
}

export function canRequestSparePart(user: User): boolean {
  return canRequestSparePartByRole(user.role);
}

export function canManageInventory(user: User): boolean {
  return canManageInventoryByRole(user.role);
}

export function canManageLoans(user: User): boolean {
  return canManageLoansByRole(user.role);
}

export function canManageCalibration(user: User): boolean {
  return canManageCalibrationByRole(user.role);
}

export function canManageProjects(user: User): boolean {
  return canManageProjectsByRole(user.role);
}

export function canViewPerformance(user: User): boolean {
  return canViewPerformanceByRole(user.role);
}

export function canViewPlantMap(user: User): boolean {
  return canViewPlantMapByRole(user.role);
}
