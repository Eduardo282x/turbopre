import type { Phase, RouteSheet, RouteSheetWithRelations, User } from '@/features/preview/types';

export function isGlobal(user: User): boolean {
  return user.role === 'GLOBAL';
}

export function canManageRoutes(user: User): boolean {
  return ['GLOBAL', 'PLANNING', 'SECTION_CHIEF'].includes(user.role);
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
  return ['GLOBAL', 'ENGINEERING', 'SECTION_CHIEF'].includes(user.role) && route.status === 'IN_REVIEW';
}

export function canStartRoute(user: User, route: RouteSheet): boolean {
  return ['GLOBAL', 'PLANNING', 'WORKSHOP', 'SECTION_CHIEF', 'FIELD', 'PROJECT'].includes(user.role) && route.status === 'APPROVED';
}

export function canSendToQuality(user: User, route: RouteSheetWithRelations): boolean {
  return (
    ['GLOBAL', 'WORKSHOP', 'ENGINEERING', 'SECTION_CHIEF', 'FIELD', 'PROJECT'].includes(user.role) &&
    route.status === 'IN_PROGRESS' &&
    route.phases.length > 0 &&
    route.phases.every((phase) => phase.status === 'COMPLETED')
  );
}

export function canApproveQuality(user: User, route: RouteSheet): boolean {
  return ['GLOBAL', 'QUALITY', 'NDT'].includes(user.role) && route.status === 'IN_QUALITY';
}

export function canDeliverRoute(user: User, route: RouteSheet): boolean {
  return ['GLOBAL', 'SALES', 'PROJECT', 'FIELD'].includes(user.role) && route.status === 'READY_FOR_DELIVERY';
}

export function canAddPart(user: User, route: RouteSheet): boolean {
  return ['GLOBAL', 'PLANNING', 'SECTION_CHIEF'].includes(user.role) && ['DRAFT', 'IN_REVIEW'].includes(route.status);
}

export function canAddInspection(user: User, route: RouteSheet): boolean {
  return (
    ['GLOBAL', 'WORKSHOP', 'ENGINEERING', 'SECTION_CHIEF', 'NDT', 'FIELD'].includes(user.role) &&
    ['APPROVED', 'IN_PROGRESS', 'IN_QUALITY'].includes(route.status)
  );
}

export function canRequestSparePart(user: User, route: RouteSheet): boolean {
  return (
    ['GLOBAL', 'PLANNING', 'ENGINEERING', 'WORKSHOP', 'OPERATOR', 'SECTION_CHIEF', 'FIELD', 'NDT', 'METROLOGY'].includes(user.role) &&
    route.status !== 'DELIVERED'
  );
}

export function canDispatchSparePart(user: User): boolean {
  return ['GLOBAL', 'WAREHOUSE'].includes(user.role);
}

export function canManageInventory(user: User): boolean {
  return ['GLOBAL', 'WAREHOUSE', 'METROLOGY'].includes(user.role);
}

export function canManageLoans(user: User): boolean {
  return ['GLOBAL', 'WAREHOUSE', 'METROLOGY'].includes(user.role);
}

export function canManageCalibration(user: User): boolean {
  return ['GLOBAL', 'METROLOGY', 'WAREHOUSE', 'QUALITY'].includes(user.role);
}

export function canCreateServiceOrder(user: User): boolean {
  return ['GLOBAL', 'PLANNING', 'SALES', 'PROJECT', 'FIELD'].includes(user.role);
}

export function canManageServiceOrder(user: User): boolean {
  return ['GLOBAL', 'PLANNING', 'SALES', 'PROJECT', 'FIELD', 'SECTION_CHIEF'].includes(user.role);
}

export function canManageQuality(user: User): boolean {
  return ['GLOBAL', 'QUALITY', 'NDT', 'ENGINEERING', 'SECTION_CHIEF'].includes(user.role);
}

export function canManageNonConformities(user: User): boolean {
  return ['GLOBAL', 'QUALITY', 'NDT', 'ENGINEERING', 'HSE', 'SECTION_CHIEF'].includes(user.role);
}

export function canManageField(user: User): boolean {
  return ['GLOBAL', 'FIELD', 'PROJECT', 'HSE'].includes(user.role);
}

export function canManageProjects(user: User): boolean {
  return ['GLOBAL', 'PROJECT', 'ENGINEERING', 'PROCUREMENT'].includes(user.role);
}

export function canManageSupply(user: User): boolean {
  return ['GLOBAL', 'PROCUREMENT', 'WAREHOUSE', 'SALES'].includes(user.role);
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
  if (user.role === 'SECTION_CHIEF') return user.areaId === phase.areaId || phase.type === 'INSPECTION';
  if (user.role === 'WORKSHOP') {
    return phase.areaId === 'workshop' || phase.areaId === 'assembly' || phase.type === 'INSPECTION';
  }
  if (user.role === 'ENGINEERING') {
    return phase.areaId === 'engineering' || phase.type === 'INSPECTION';
  }
  if (user.role === 'QUALITY') {
    return phase.areaId === 'quality' || phase.type === 'QUALITY';
  }
  if (user.role === 'NDT') {
    return phase.type === 'INSPECTION' || phase.areaId === 'quality' || phase.areaId === 'metrology';
  }
  if (user.role === 'METROLOGY') return phase.areaId === 'metrology';
  if (user.role === 'FIELD') return phase.areaId.startsWith('field_') || phase.type === 'INSPECTION';
  if (user.role === 'PROJECT') return phase.areaId === 'projects';
  if (user.role === 'PLANNING') return phase.areaId === 'planning';
  return false;
}
