import type { Phase, RouteSheet, RouteSheetWithRelations, User } from '@/features/preview/types';

export function isGlobal(user: User): boolean {
  return user.role === 'GLOBAL';
}

export function canManageRoutes(user: User): boolean {
  return ['GLOBAL', 'PLANNING'].includes(user.role);
}

export function canEditRoute(user: User, route: RouteSheet): boolean {
  if (user.role === 'GLOBAL') return true;
  if (user.role === 'PLANNING') return ['DRAFT', 'IN_REVIEW'].includes(route.status);
  return false;
}

export function canSendToReview(user: User, route: RouteSheet): boolean {
  return ['GLOBAL', 'PLANNING'].includes(user.role) && route.status === 'DRAFT';
}

export function canApproveRoute(user: User, route: RouteSheet): boolean {
  return ['GLOBAL', 'ENGINEERING'].includes(user.role) && route.status === 'IN_REVIEW';
}

export function canStartRoute(user: User, route: RouteSheet): boolean {
  return ['GLOBAL', 'PLANNING', 'WORKSHOP'].includes(user.role) && route.status === 'APPROVED';
}

export function canSendToQuality(user: User, route: RouteSheetWithRelations): boolean {
  return (
    ['GLOBAL', 'WORKSHOP', 'ENGINEERING'].includes(user.role) &&
    route.status === 'IN_PROGRESS' &&
    route.phases.length > 0 &&
    route.phases.every((phase) => phase.status === 'COMPLETED')
  );
}

export function canApproveQuality(user: User, route: RouteSheet): boolean {
  return ['GLOBAL', 'QUALITY'].includes(user.role) && route.status === 'IN_QUALITY';
}

export function canDeliverRoute(user: User, route: RouteSheet): boolean {
  return ['GLOBAL', 'SALES'].includes(user.role) && route.status === 'READY_FOR_DELIVERY';
}

export function canAddPart(user: User, route: RouteSheet): boolean {
  return ['GLOBAL', 'PLANNING'].includes(user.role) && ['DRAFT', 'IN_REVIEW'].includes(route.status);
}

export function canAddInspection(user: User, route: RouteSheet): boolean {
  return (
    ['GLOBAL', 'WORKSHOP', 'ENGINEERING'].includes(user.role) &&
    ['APPROVED', 'IN_PROGRESS', 'IN_QUALITY'].includes(route.status)
  );
}

export function canRequestSparePart(user: User, route: RouteSheet): boolean {
  return (
    ['GLOBAL', 'PLANNING', 'ENGINEERING', 'WORKSHOP', 'OPERATOR'].includes(user.role) &&
    route.status !== 'DELIVERED'
  );
}

export function canDispatchSparePart(user: User): boolean {
  return ['GLOBAL', 'WAREHOUSE'].includes(user.role);
}

export function canManageInventory(user: User): boolean {
  return ['GLOBAL', 'WAREHOUSE'].includes(user.role);
}

export function canManageLoans(user: User): boolean {
  return ['GLOBAL', 'WAREHOUSE'].includes(user.role);
}

export function canManageUsers(user: User): boolean {
  return user.role === 'GLOBAL';
}

export function canViewAudit(user: User): boolean {
  return user.role === 'GLOBAL';
}

export function canCompletePhase(user: User, phase: Phase): boolean {
  if (user.role === 'GLOBAL') return true;
  if (user.role === 'OPERATOR') return user.areaId === phase.areaId;
  if (user.role === 'WORKSHOP') {
    return phase.areaId === 'workshop' || phase.type === 'INSPECTION';
  }
  if (user.role === 'ENGINEERING') {
    return phase.areaId === 'engineering' || phase.type === 'INSPECTION';
  }
  if (user.role === 'QUALITY') {
    return phase.areaId === 'quality' || phase.type === 'QUALITY';
  }
  if (user.role === 'PLANNING') return phase.areaId === 'planning';
  return false;
}
