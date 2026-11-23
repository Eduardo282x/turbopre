import type { Inspection, RouteSheet, Task, User } from '@/features/preview/types';

export function isGlobal(user: User): boolean {
  return user.role === 'GLOBAL';
}

export function canManageUsers(user: User): boolean {
  return user.role === 'GLOBAL';
}

export function canViewAudit(user: User): boolean {
  return user.role === 'GLOBAL';
}

export function canManageServiceOrders(user: User): boolean {
  return ['GLOBAL', 'SALES'].includes(user.role);
}

export function canCreateInspection(user: User): boolean {
  return ['GLOBAL', 'WORKSHOP'].includes(user.role);
}

export function canApproveInspection(user: User): boolean {
  return ['GLOBAL', 'WORKSHOP'].includes(user.role);
}

export function canEditInspection(user: User, inspection: Inspection): boolean {
  if (!['GLOBAL', 'WORKSHOP'].includes(user.role)) return false;
  return !['APPROVED'].includes(inspection.status);
}

export function canManageRoutes(user: User): boolean {
  return ['GLOBAL', 'ENGINEERING'].includes(user.role);
}

export function canEditRoute(user: User, route: RouteSheet): boolean {
  if (user.role === 'GLOBAL') return true;
  return user.role === 'ENGINEERING' && ['DRAFT', 'IN_ANNEXES', 'IN_QUALITY'].includes(route.status);
}

export function canSendRouteToApproval(user: User, route: RouteSheet): boolean {
  return ['GLOBAL', 'ENGINEERING'].includes(user.role) && route.status === 'DRAFT';
}

export function canApproveRoute(user: User, route: RouteSheet): boolean {
  return ['GLOBAL', 'PROJECT'].includes(user.role) && route.status === 'PENDING_APPROVAL';
}

export function canFinalizeAnnexes(user: User, route: RouteSheet): boolean {
  return ['GLOBAL', 'ENGINEERING'].includes(user.role) && route.status === 'IN_ANNEXES';
}

export function canApproveQuality(user: User, route: RouteSheet): boolean {
  return ['GLOBAL', 'QUALITY'].includes(user.role) && route.status === 'IN_QUALITY';
}

export function canDeliverRoute(user: User, route: RouteSheet): boolean {
  return ['GLOBAL', 'SALES'].includes(user.role) && route.status === 'READY_FOR_DELIVERY';
}

export function canCompleteTask(user: User, task: Task): boolean {
  if (task.status === 'COMPLETED' || task.status === 'BLOCKED') return false;
  if (user.role === 'GLOBAL') return true;
  if (task.assignedUserId) return task.assignedUserId === user.id;
  return Boolean(user.positionId) && user.positionId === task.positionId;
}

export function canRequestSparePart(user: User): boolean {
  return ['GLOBAL', 'WORKSHOP', 'ENGINEERING', 'OPERATOR'].includes(user.role);
}

export function canManageInventory(user: User): boolean {
  return ['GLOBAL', 'WAREHOUSE'].includes(user.role);
}

export function canManageLoans(user: User): boolean {
  return ['GLOBAL', 'WAREHOUSE'].includes(user.role);
}

export function canManageCalibration(user: User): boolean {
  return ['GLOBAL', 'WAREHOUSE'].includes(user.role);
}

export function canManageProjects(user: User): boolean {
  return ['GLOBAL', 'ENGINEERING'].includes(user.role);
}

export function canViewPerformance(user: User): boolean {
  return ['GLOBAL', 'ENGINEERING', 'PROJECT'].includes(user.role);
}

export function canViewPlantMap(user: User): boolean {
  return ['GLOBAL', 'WORKSHOP', 'PROJECT'].includes(user.role);
}
