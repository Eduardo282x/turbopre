import {
  AREAS,
  AREA_BY_ID,
  ROUTE_STATUS_META,
  ROUTE_STATUS_ORDER,
} from '../config';
import type {
  Area,
  Asset,
  AuditEntry,
  Client,
  Component,
  FieldJobWithRelations,
  NonConformity,
  Part,
  Phase,
  PreviewDatabase,
  ProjectWithRelations,
  QualityRecord,
  RouteSheet,
  RouteSheetWithRelations,
  ServiceOrder,
  ServiceOrderWithRelations,
  SparePart,
  SupplyOrderWithRelations,
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
  if (user.role === 'SECTION_CHIEF') {
    return contexts.filter(
      (context) => context.phase.areaId === user.areaId || context.phase.type === 'INSPECTION',
    );
  }
  if (user.role === 'NDT') {
    return contexts.filter(
      (context) =>
        context.phase.type === 'INSPECTION' ||
        context.phase.areaId === 'quality' ||
        context.phase.areaId === 'metrology',
    );
  }
  if (user.role === 'METROLOGY') {
    return contexts.filter((context) => context.phase.areaId === 'metrology');
  }
  if (user.role === 'FIELD') {
    return contexts.filter(
      (context) => context.phase.areaId.startsWith('field_') || context.phase.type === 'INSPECTION',
    );
  }
  if (user.role === 'PROJECT') {
    return contexts.filter((context) => context.phase.areaId === 'projects');
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
  if (user.role === 'HSE' || user.role === 'PROCUREMENT') return [];
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
  return AREAS.filter((area) => ['production', 'engineering', 'support', 'field', 'projects', 'supply'].includes(area.group)).map((area) => ({
    areaId: area.id,
    name: area.shortName,
    value: db.phases.filter(
      (phase) => phase.areaId === area.id && phase.status !== 'COMPLETED',
    ).length,
    color: area.color,
  }));
}

export function getAreaPerformanceData(db: PreviewDatabase) {
  return AREAS.filter((area) => ['production', 'engineering', 'support', 'field', 'projects', 'supply'].includes(area.group)).map((area) => {
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

export function getAssetById(db: PreviewDatabase, assetId?: string): Asset | undefined {
  return assetId ? db.assets.find((asset) => asset.id === assetId) : undefined;
}

export function getServiceOrderProgress(order: ServiceOrder, db: PreviewDatabase): number {
  if (order.routeSheetId) {
    const route = (db.routeSheets ?? []).find((item) => item.id === order.routeSheetId);
    if (route) {
      const phases = (db.phases ?? []).filter((phase) => phase.routeSheetId === route.id);
      return getRouteProgress(phases).progress;
    }
  }
  const project = (db.projects ?? []).find((item) => item.serviceOrderId === order.id);
  if (project) return project.progress;
  const fieldJob = (db.fieldJobs ?? []).find((item) => item.serviceOrderId === order.id);
  if (fieldJob) {
    const fieldProgress: Record<string, number> = {
      PLANNED: 10,
      MOBILIZED: 30,
      IN_EXECUTION: 60,
      DEMOBILIZED: 85,
      CLOSED: 100,
    };
    return fieldProgress[fieldJob.status] ?? 0;
  }
  const supply = (db.supplyOrders ?? []).find((item) => item.serviceOrderId === order.id);
  if (supply) {
    const supplyProgress: Record<string, number> = {
      REQUESTED: 10,
      QUOTED: 25,
      PURCHASED: 45,
      INSPECTION: 70,
      DISPATCHED: 85,
      DELIVERED: 100,
    };
    return supplyProgress[supply.status] ?? 0;
  }
  return 0;
}

export function getServiceOrderWithRelations(
  db: PreviewDatabase,
  orderId: string,
): ServiceOrderWithRelations | undefined {
  const order = (db.serviceOrders ?? []).find((item) => item.id === orderId);
  if (!order) return undefined;
  const qualityRecords = (db.qualityRecords ?? []).filter((record) => record.serviceOrderId === order.id);
  const nonConformities = (db.nonConformities ?? []).filter((record) => record.serviceOrderId === order.id);
  return {
    ...order,
    client: getClientById(db, order.clientId),
    asset: getAssetById(db, order.assetId),
    creator: getUserById(db, order.createdBy) ?? db.users[0],
    routeSheet: order.routeSheetId ? getRouteSheetWithRelations(db, order.routeSheetId) : undefined,
    fieldJob: (db.fieldJobs ?? []).find((item) => item.serviceOrderId === order.id),
    project: (db.projects ?? []).find((item) => item.serviceOrderId === order.id),
    supplyOrder: (db.supplyOrders ?? []).find((item) => item.serviceOrderId === order.id),
    qualityRecords,
    nonConformities,
    progress: getServiceOrderProgress(order, db),
    openNonConformities: nonConformities.filter((record) => record.status !== 'CLOSED').length,
  };
}

export function getServiceOrdersWithRelations(db: PreviewDatabase): ServiceOrderWithRelations[] {
  return (db.serviceOrders ?? [])
    .map((order) => getServiceOrderWithRelations(db, order.id))
    .filter((order): order is ServiceOrderWithRelations => Boolean(order));
}

export function getServiceOrderMetrics(db: PreviewDatabase) {
  const orders = db.serviceOrders ?? [];
  const nonConformities = db.nonConformities ?? [];
  const qualityRecords = db.qualityRecords ?? [];
  return {
    total: orders.length,
    shop: orders.filter((order) => order.mode === 'SHOP').length,
    field: orders.filter((order) => order.mode === 'FIELD').length,
    project: orders.filter((order) => order.mode === 'PROJECT').length,
    supply: orders.filter((order) => order.mode === 'SUPPLY').length,
    active: orders.filter((order) => ['APPROVED', 'IN_EXECUTION', 'IN_QUALITY'].includes(order.status)).length,
    inQuality: orders.filter((order) => order.status === 'IN_QUALITY').length,
    readyForDelivery: orders.filter((order) => order.status === 'READY_FOR_DELIVERY').length,
    delivered: orders.filter((order) => ['DELIVERED', 'CLOSED'].includes(order.status)).length,
    critical: orders.filter((order) => order.priority === 'CRITICAL' && !['DELIVERED', 'CLOSED', 'CANCELLED'].includes(order.status)).length,
    openNonConformities: nonConformities.filter((record) => record.status !== 'CLOSED').length,
    pendingQualityRecords: qualityRecords.filter((record) => record.result === 'PENDING').length,
    failedQualityRecords: qualityRecords.filter((record) => record.result === 'FAIL').length,
  };
}

export function getFieldJobsWithRelations(db: PreviewDatabase): FieldJobWithRelations[] {
  const relations: Array<FieldJobWithRelations | null> = (db.fieldJobs ?? []).map((job) => {
    const serviceOrder = (db.serviceOrders ?? []).find((order) => order.id === job.serviceOrderId);
    if (!serviceOrder) return null;
    return {
      ...job,
      serviceOrder,
      client: getClientById(db, serviceOrder.clientId),
      asset: getAssetById(db, serviceOrder.assetId),
    };
  });
  return relations.filter((job): job is FieldJobWithRelations => job !== null);
}

export function getProjectsWithRelations(db: PreviewDatabase): ProjectWithRelations[] {
  const relations: Array<ProjectWithRelations | null> = (db.projects ?? []).map((project) => {
    const serviceOrder = (db.serviceOrders ?? []).find((order) => order.id === project.serviceOrderId);
    if (!serviceOrder) return null;
    return {
      ...project,
      serviceOrder,
      client: getClientById(db, serviceOrder.clientId),
      asset: getAssetById(db, serviceOrder.assetId),
    };
  });
  return relations.filter((project): project is ProjectWithRelations => project !== null);
}

export function getSupplyOrdersWithRelations(db: PreviewDatabase): SupplyOrderWithRelations[] {
  const relations: Array<SupplyOrderWithRelations | null> = (db.supplyOrders ?? []).map((supply) => {
    const serviceOrder = (db.serviceOrders ?? []).find((order) => order.id === supply.serviceOrderId);
    if (!serviceOrder) return null;
    return {
      ...supply,
      serviceOrder,
      client: getClientById(db, serviceOrder.clientId),
      asset: getAssetById(db, serviceOrder.assetId),
    };
  });
  return relations.filter((supply): supply is SupplyOrderWithRelations => supply !== null);
}

export function getCalibrationItems(db: PreviewDatabase) {
  return (db.inventory ?? [])
    .filter((item) => item.calibrationDue)
    .map((item) => {
      const due = new Date(item.calibrationDue as string).getTime();
      const days = Math.ceil((due - Date.now()) / 86400000);
      const status: 'VALID' | 'DUE_SOON' | 'EXPIRED' = days < 0 ? 'EXPIRED' : days <= 30 ? 'DUE_SOON' : 'VALID';
      return { item, days, status };
    })
    .sort((a, b) => a.days - b.days);
}

export function getOpenNonConformities(db: PreviewDatabase): NonConformity[] {
  return (db.nonConformities ?? []).filter((record) => record.status !== 'CLOSED');
}

export function getQualityRecordsByType(db: PreviewDatabase, type: QualityRecord['type']): QualityRecord[] {
  return (db.qualityRecords ?? []).filter((record) => record.type === type);
}
