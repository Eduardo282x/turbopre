import {
  AREAS,
  AREA_BY_ID,
  ROUTE_STATUS_META,
  ROUTE_STATUS_ORDER,
} from '../config';
import type {
  Area,
  AuditEntry,
  Client,
  Component,
  Part,
  Phase,
  PreviewDatabase,
  RouteSheet,
  RouteSheetWithRelations,
  SparePart,
  User,
} from '../types';

export interface PhaseWithContext {
  phase: Phase;
  part: Part;
  route: RouteSheet;
  component: Component;
  client?: Client;
  area: Area;
}

export interface RouteMetrics {
  total: number;
  active: number;
  delivered: number;
  critical: number;
  inReview: number;
  inQuality: number;
  readyForDelivery: number;
  totalParts: number;
  totalPhases: number;
  completedPhases: number;
}

export function getUserById(db: PreviewDatabase, userId?: string): User | undefined {
  return userId ? db.users.find((user) => user.id === userId) : undefined;
}

export function getClientById(db: PreviewDatabase, clientId?: string): Client | undefined {
  return clientId ? db.clients.find((client) => client.id === clientId) : undefined;
}

export function getComponentById(db: PreviewDatabase, componentId?: string): Component | undefined {
  return componentId ? db.components.find((component) => component.id === componentId) : undefined;
}

export function getInventoryById(db: PreviewDatabase, itemId: string) {
  return db.inventory.find((item) => item.id === itemId);
}

export function getRouteProgress(phases: Phase[]): { completed: number; total: number; progress: number } {
  const total = phases.length;
  const completed = phases.filter((phase) => phase.status === 'COMPLETED').length;
  return { completed, total, progress: total === 0 ? 0 : Math.round((completed / total) * 100) };
}

export function getRouteSheetWithRelations(
  db: PreviewDatabase,
  routeId: string,
): RouteSheetWithRelations | undefined {
  const route = db.routeSheets.find((item) => item.id === routeId);
  if (!route) return undefined;
  const component = getComponentById(db, route.componentId);
  if (!component) return undefined;
  const parts = db.parts.filter((part) => part.routeSheetId === routeId);
  const phases = db.phases.filter((phase) => phase.routeSheetId === routeId);
  const progress = getRouteProgress(phases);
  return {
    ...route,
    component,
    client: getClientById(db, route.clientId),
    creator: getUserById(db, route.createdBy) ?? db.users[0],
    parts,
    phases,
    spareParts: db.spareParts.filter((spare) => spare.routeSheetId === routeId),
    progress: progress.progress,
    completedPhases: progress.completed,
    totalPhases: progress.total,
  };
}

export function getRoutesWithRelations(db: PreviewDatabase): RouteSheetWithRelations[] {
  return db.routeSheets
    .map((route) => getRouteSheetWithRelations(db, route.id))
    .filter((route): route is RouteSheetWithRelations => Boolean(route));
}

export function getPhaseContexts(db: PreviewDatabase): PhaseWithContext[] {
  const routes = new Map(db.routeSheets.map((route) => [route.id, route]));
  const parts = new Map(db.parts.map((part) => [part.id, part]));
  const components = new Map(db.components.map((component) => [component.id, component]));
  const clients = new Map(db.clients.map((client) => [client.id, client]));

  const contexts: Array<PhaseWithContext | null> = db.phases.map((phase) => {
    const route = routes.get(phase.routeSheetId);
    const part = parts.get(phase.partId);
    if (!route || !part) return null;
    const component = components.get(route.componentId);
    const area = AREA_BY_ID[phase.areaId];
    if (!component || !area) return null;
    return {
      phase,
      part,
      route,
      component,
      client: route.clientId ? clients.get(route.clientId) : undefined,
      area,
    };
  });

  return contexts.filter((context): context is PhaseWithContext => context !== null);
}

export function getMyTasks(db: PreviewDatabase, user: User): PhaseWithContext[] {
  const contexts = getPhaseContexts(db).filter((context) => context.phase.status !== 'COMPLETED');
  if (user.role === 'GLOBAL') return contexts;
  if (user.role === 'OPERATOR') {
    return contexts.filter((context) => context.phase.areaId === user.areaId);
  }
  if (user.role === 'QUALITY') {
    return contexts.filter((context) => context.phase.areaId === 'quality' || context.phase.type === 'QUALITY');
  }
  if (user.role === 'ENGINEERING') {
    return contexts.filter(
      (context) =>
        context.phase.areaId === 'engineering' ||
        context.phase.type === 'INSPECTION' ||
        context.route.status === 'IN_REVIEW',
    );
  }
  if (user.role === 'WORKSHOP') {
    return contexts.filter(
      (context) =>
        context.phase.areaId === 'workshop' ||
        context.phase.type === 'INSPECTION' ||
        context.route.status === 'IN_REVIEW',
    );
  }
  if (user.role === 'PLANNING') {
    return contexts.filter((context) => context.route.status === 'DRAFT');
  }
  if (user.role === 'SALES') {
    return contexts.filter(
      (context) =>
        context.route.status === 'READY_FOR_DELIVERY' || context.route.status === 'DELIVERED',
    );
  }
  return contexts;
}

export function getPendingApprovals(db: PreviewDatabase): RouteSheetWithRelations[] {
  return getRoutesWithRelations(db)
    .filter((route) => route.status === 'IN_REVIEW')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getQualityQueue(db: PreviewDatabase): RouteSheetWithRelations[] {
  return getRoutesWithRelations(db)
    .filter((route) => route.status === 'IN_QUALITY')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}

export function getWarehouseRequests(db: PreviewDatabase): SparePart[] {
  return db.spareParts
    .filter((spare) => spare.status !== 'DISPATCHED')
    .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
}

export function getRecentAudit(db: PreviewDatabase, limit = 12): AuditEntry[] {
  return [...db.audit]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export function getRouteMetrics(db: PreviewDatabase): RouteMetrics {
  const total = db.routeSheets.length;
  const active = db.routeSheets.filter((route) =>
    ['APPROVED', 'IN_PROGRESS', 'IN_QUALITY'].includes(route.status),
  ).length;
  const delivered = db.routeSheets.filter((route) => route.status === 'DELIVERED').length;
  const critical = db.routeSheets.filter(
    (route) => route.priority === 'CRITICAL' && route.status !== 'DELIVERED',
  ).length;
  const inReview = db.routeSheets.filter((route) => route.status === 'IN_REVIEW').length;
  const inQuality = db.routeSheets.filter((route) => route.status === 'IN_QUALITY').length;
  const readyForDelivery = db.routeSheets.filter((route) => route.status === 'READY_FOR_DELIVERY').length;

  return {
    total,
    active,
    delivered,
    critical,
    inReview,
    inQuality,
    readyForDelivery,
    totalParts: db.parts.length,
    totalPhases: db.phases.length,
    completedPhases: db.phases.filter((phase) => phase.status === 'COMPLETED').length,
  };
}

export function getStatusChartData(db: PreviewDatabase) {
  return ROUTE_STATUS_ORDER.map((status) => ({
    status,
    name: ROUTE_STATUS_META[status].shortLabel,
    value: db.routeSheets.filter((route) => route.status === status).length,
  }));
}

export function getAreaWorkloadData(db: PreviewDatabase) {
  return AREAS.filter((area) => ['production', 'engineering', 'support'].includes(area.group)).map((area) => ({
    areaId: area.id,
    name: area.shortName,
    value: db.phases.filter(
      (phase) => phase.areaId === area.id && phase.status !== 'COMPLETED',
    ).length,
    color: area.color,
  }));
}

export function getAreaPerformanceData(db: PreviewDatabase) {
  return AREAS.filter((area) => ['production', 'engineering', 'support'].includes(area.group)).map((area) => {
    const durations = db.phases
      .filter(
        (phase) =>
          phase.areaId === area.id &&
          phase.status === 'COMPLETED' &&
          phase.startedAt &&
          phase.completedAt,
      )
      .map((phase) => {
        const start = new Date(phase.startedAt as string).getTime();
        const end = new Date(phase.completedAt as string).getTime();
        return Math.max(0.1, (end - start) / 3600000);
      });
    const hours =
      durations.length === 0
        ? 0
        : Math.round((durations.reduce((sum, value) => sum + value, 0) / durations.length) * 10) / 10;
    return { areaId: area.id, name: area.shortName, hours, color: area.color };
  });
}

export function getClientVolumeData(db: PreviewDatabase) {
  return db.clients
    .map((client) => ({
      clientId: client.id,
      name: client.name,
      value: db.routeSheets.filter((route) => route.clientId === client.id).length,
    }))
    .filter((entry) => entry.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}

export function getSalesStatusData(db: PreviewDatabase) {
  const notStarted = db.routeSheets.filter((route) =>
    ['DRAFT', 'IN_REVIEW', 'APPROVED'].includes(route.status),
  ).length;
  const inWorkshop = db.routeSheets.filter((route) => route.status === 'IN_PROGRESS').length;
  const inQuality = db.routeSheets.filter((route) => route.status === 'IN_QUALITY').length;
  const ready = db.routeSheets.filter((route) => route.status === 'READY_FOR_DELIVERY').length;
  const delivered = db.routeSheets.filter((route) => route.status === 'DELIVERED').length;
  return [
    { name: 'Por iniciar', value: notStarted, color: '#64748b' },
    { name: 'En taller', value: inWorkshop, color: '#00d1ff' },
    { name: 'En calidad', value: inQuality, color: '#ffb020' },
    { name: 'Por entregar', value: ready, color: '#22c55e' },
    { name: 'Entregadas', value: delivered, color: '#3b82f6' },
  ];
}

export function getUpcomingDeliveries(db: PreviewDatabase) {
  return getRoutesWithRelations(db)
    .filter((route) =>
      ['APPROVED', 'IN_PROGRESS', 'IN_QUALITY', 'READY_FOR_DELIVERY'].includes(route.status),
    )
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);
}
