import { POSITION_BY_ID, PROCESSES, PROCESS_BY_ID, ROUTE_STATUS_ORDER } from '../config';
import type {
  Asset,
  Client,
  InspectionWithRelations,
  PreviewDatabase,
  Process,
  RouteSheet,
  RouteSheetWithRelations,
  ServiceOrder,
  ServiceOrderStatus,
  ServiceOrderWithRelations,
  SpareItem,
  SpareRequest,
  Task,
  TaskWithContext,
  User,
} from '../types';

export interface RouteMetrics {
  total: number;
  active: number;
  pendingApproval: number;
  inAnnexes: number;
  inQuality: number;
  readyForDelivery: number;
  delivered: number;
  critical: number;
  totalTasks: number;
  completedTasks: number;
}

export interface InspectionMetrics {
  total: number;
  open: number;
  inProgress: number;
  completed: number;
  approved: number;
  rejected: number;
}

export interface ServiceOrderMetrics {
  total: number;
  received: number;
  inInspection: number;
  inRoute: number;
  inExecution: number;
  inAnnexes: number;
  inQuality: number;
  readyForDelivery: number;
  delivered: number;
  critical: number;
}

export interface Progress {
  completed: number;
  total: number;
  progress: number;
}

export interface StageGroup {
  stage: number;
  tasks: Task[];
  completed: boolean;
  active: boolean;
}

export interface WarehouseItem {
  request: SpareRequest;
  item: SpareItem;
  route?: RouteSheet;
  serviceOrder?: ServiceOrder;
}

export function getUserById(db: PreviewDatabase, userId?: string): User | undefined {
  return userId ? db.users.find((user) => user.id === userId) : undefined;
}

export function getClientById(db: PreviewDatabase, clientId?: string): Client | undefined {
  return clientId ? db.clients.find((client) => client.id === clientId) : undefined;
}

export function getAssetById(db: PreviewDatabase, assetId?: string): Asset | undefined {
  return assetId ? db.assets.find((asset) => asset.id === assetId) : undefined;
}

export function getServiceOrderById(db: PreviewDatabase, id?: string): ServiceOrder | undefined {
  return id ? db.serviceOrders.find((order) => order.id === id) : undefined;
}

export function getInventoryById(db: PreviewDatabase, itemId: string) {
  return db.inventory.find((item) => item.id === itemId);
}

export function getTasksForInspection(db: PreviewDatabase, inspectionId: string): Task[] {
  return db.tasks
    .filter((task) => task.inspectionId === inspectionId)
    .sort((a, b) => a.step - b.step);
}

export function getTasksForRoute(db: PreviewDatabase, routeId: string): Task[] {
  return db.tasks
    .filter((task) => task.routeSheetId === routeId)
    .sort((a, b) => a.step - b.step);
}

export function getProgress(tasks: Task[]): Progress {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.status === 'COMPLETED').length;
  return { completed, total, progress: total === 0 ? 0 : Math.round((completed / total) * 100) };
}

export function getCurrentStage(tasks: Task[]): number | undefined {
  if (tasks.length === 0) return undefined;
  const stages = [...new Set(tasks.map((task) => task.stage))].sort((a, b) => a - b);
  return stages.find((stage) =>
    tasks.filter((task) => task.stage === stage).some((task) => task.status !== 'COMPLETED'),
  );
}

export function getStageGroups(tasks: Task[]): StageGroup[] {
  const stages = [...new Set(tasks.map((task) => task.stage))].sort((a, b) => a - b);
  const current = getCurrentStage(tasks);
  return stages.map((stage) => {
    const stageTasks = tasks.filter((task) => task.stage === stage);
    return {
      stage,
      tasks: stageTasks,
      completed: stageTasks.every((task) => task.status === 'COMPLETED'),
      active: stage === current,
    };
  });
}

export function getInspectionWithRelations(
  db: PreviewDatabase,
  inspectionId: string,
): InspectionWithRelations | undefined {
  const inspection = db.inspections.find((item) => item.id === inspectionId);
  if (!inspection) return undefined;
  const serviceOrder = getServiceOrderById(db, inspection.serviceOrderId);
  if (!serviceOrder) return undefined;
  const tasks = getTasksForInspection(db, inspectionId);
  const progress = getProgress(tasks);
  return {
    ...inspection,
    serviceOrder,
    client: getClientById(db, serviceOrder.clientId),
    asset: getAssetById(db, serviceOrder.assetId),
    creator: getUserById(db, inspection.createdBy) ?? db.users[0],
    approver: getUserById(db, inspection.approvedBy),
    tasks,
    progress: progress.progress,
    completedTasks: progress.completed,
    totalTasks: progress.total,
  };
}

export function getInspectionsWithRelations(db: PreviewDatabase): InspectionWithRelations[] {
  return db.inspections
    .map((inspection) => getInspectionWithRelations(db, inspection.id))
    .filter((inspection): inspection is InspectionWithRelations => Boolean(inspection));
}

export function getRouteSheetWithRelations(
  db: PreviewDatabase,
  routeId: string,
): RouteSheetWithRelations | undefined {
  const route = db.routeSheets.find((item) => item.id === routeId);
  if (!route) return undefined;
  const serviceOrder = getServiceOrderById(db, route.serviceOrderId);
  const inspection = getInspectionWithRelations(db, route.inspectionId);
  if (!serviceOrder || !inspection) return undefined;
  const tasks = getTasksForRoute(db, routeId);
  const progress = getProgress(tasks);
  const currentStage = getCurrentStage(tasks);
  const activeTask = tasks.find((task) => task.status !== 'COMPLETED');
  return {
    ...route,
    serviceOrder,
    inspection,
    client: getClientById(db, serviceOrder.clientId),
    asset: getAssetById(db, serviceOrder.assetId),
    creator: getUserById(db, route.createdBy) ?? db.users[0],
    approver: getUserById(db, route.approvedBy),
    tasks,
    spareRequests: db.spareRequests.filter((request) => request.routeSheetId === routeId),
    progress: progress.progress,
    completedTasks: progress.completed,
    totalTasks: progress.total,
    currentStage,
    activeProcess: activeTask ? PROCESS_BY_ID[activeTask.processId] : undefined,
  };
}

export function getRouteSheetsWithRelations(db: PreviewDatabase): RouteSheetWithRelations[] {
  return db.routeSheets
    .map((route) => getRouteSheetWithRelations(db, route.id))
    .filter((route): route is RouteSheetWithRelations => Boolean(route));
}

export function getServiceOrderStatus(db: PreviewDatabase, order: ServiceOrder): ServiceOrderStatus {
  if (order.cancelledAt) return 'CANCELLED';
  const route = order.routeSheetId
    ? db.routeSheets.find((item) => item.id === order.routeSheetId)
    : undefined;
  if (route) {
    if (route.status === 'DELIVERED') return 'DELIVERED';
    if (route.status === 'READY_FOR_DELIVERY') return 'READY_FOR_DELIVERY';
    if (route.status === 'IN_QUALITY') return 'IN_QUALITY';
    if (route.status === 'IN_ANNEXES') return 'IN_ANNEXES';
    if (route.status === 'IN_PROGRESS' || route.status === 'APPROVED') return 'IN_EXECUTION';
    return 'IN_ROUTE';
  }
  const inspection = order.inspectionId
    ? db.inspections.find((item) => item.id === order.inspectionId)
    : undefined;
  if (inspection?.status === 'APPROVED') return 'INSPECTION_APPROVED';
  if (inspection) return 'IN_INSPECTION';
  return 'RECEIVED';
}

export function getServiceOrderWithRelations(
  db: PreviewDatabase,
  orderId: string,
): ServiceOrderWithRelations | undefined {
  const order = getServiceOrderById(db, orderId);
  if (!order) return undefined;
  const routeSheet = order.routeSheetId
    ? getRouteSheetWithRelations(db, order.routeSheetId)
    : undefined;
  const inspection = order.inspectionId
    ? getInspectionWithRelations(db, order.inspectionId)
    : undefined;
  const progress = routeSheet?.progress ?? inspection?.progress ?? 0;
  return {
    ...order,
    client: getClientById(db, order.clientId),
    asset: getAssetById(db, order.assetId),
    creator: getUserById(db, order.createdBy) ?? db.users[0],
    inspection,
    routeSheet,
    status: getServiceOrderStatus(db, order),
    progress,
  };
}

export function getServiceOrdersWithRelations(db: PreviewDatabase): ServiceOrderWithRelations[] {
  return db.serviceOrders
    .map((order) => getServiceOrderWithRelations(db, order.id))
    .filter((order): order is ServiceOrderWithRelations => Boolean(order));
}

function taskContext(
  db: PreviewDatabase,
  task: Task,
): TaskWithContext | undefined {
  const process = PROCESS_BY_ID[task.processId];
  const position = POSITION_BY_ID[task.positionId];
  if (!process || !position) return undefined;
  const inspection = task.inspectionId
    ? getInspectionWithRelations(db, task.inspectionId)
    : undefined;
  const routeSheet = task.routeSheetId
    ? getRouteSheetWithRelations(db, task.routeSheetId)
    : undefined;
  const ownerOrder = routeSheet?.serviceOrder ?? inspection?.serviceOrder;
  const serviceOrder = ownerOrder ? getServiceOrderWithRelations(db, ownerOrder.id) : undefined;
  return {
    task,
    process,
    position,
    inspection,
    routeSheet,
    serviceOrder,
    client: routeSheet?.client ?? inspection?.client,
    asset: routeSheet?.asset ?? inspection?.asset,
    assignee: getUserById(db, task.assignedUserId),
  };
}

export function getTaskContexts(db: PreviewDatabase): TaskWithContext[] {
  return db.tasks
    .map((task) => taskContext(db, task))
    .filter((context): context is TaskWithContext => Boolean(context));
}

export function isTaskMine(task: Task, user: User): boolean {
  if (task.assignedUserId) return task.assignedUserId === user.id;
  return Boolean(user.positionId) && user.positionId === task.positionId;
}

export function getMyTasks(db: PreviewDatabase, user: User): TaskWithContext[] {
  if (user.role === 'GLOBAL') return [];
  if (!['OPERATOR', 'ENGINEERING', 'QUALITY'].includes(user.role)) return [];
  return getTaskContexts(db)
    .filter((context) => context.task.status !== 'COMPLETED' && isTaskMine(context.task, user))
    .sort((a, b) => {
      if (a.task.stage !== b.task.stage) return a.task.stage - b.task.stage;
      return a.task.step - b.task.step;
    });
}

export function getPendingApprovals(db: PreviewDatabase): RouteSheetWithRelations[] {
  return getRouteSheetsWithRelations(db)
    .filter((route) => route.status === 'PENDING_APPROVAL')
    .sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
}

export function getQualityQueue(db: PreviewDatabase): RouteSheetWithRelations[] {
  return getRouteSheetsWithRelations(db)
    .filter((route) => route.status === 'IN_QUALITY')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}

export function getAnnexQueue(db: PreviewDatabase): RouteSheetWithRelations[] {
  return getRouteSheetsWithRelations(db)
    .filter((route) => route.status === 'IN_ANNEXES')
    .sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
}

export function getApprovedInspectionsWithoutRoute(db: PreviewDatabase): InspectionWithRelations[] {
  const routed = new Set(db.routeSheets.map((route) => route.inspectionId));
  return getInspectionsWithRelations(db)
    .filter((inspection) => inspection.status === 'APPROVED' && !routed.has(inspection.id))
    .sort((a, b) => new Date(b.approvedAt ?? b.updatedAt).getTime() - new Date(a.approvedAt ?? a.updatedAt).getTime());
}

export function getInspectionsForWorkshop(db: PreviewDatabase): InspectionWithRelations[] {
  return getInspectionsWithRelations(db).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function getWarehousePendingItems(db: PreviewDatabase): WarehouseItem[] {
  return db.spareRequests.flatMap((request) => {
    const route = db.routeSheets.find((item) => item.id === request.routeSheetId);
    const serviceOrder = route ? getServiceOrderById(db, route.serviceOrderId) : undefined;
    return request.items
      .filter((item) => item.destination === 'WAREHOUSE' && item.status !== 'DISPATCHED')
      .map((item) => ({ request, item, route, serviceOrder }));
  });
}

export function getProcurePendingItems(db: PreviewDatabase): WarehouseItem[] {
  return db.spareRequests.flatMap((request) => {
    const route = db.routeSheets.find((item) => item.id === request.routeSheetId);
    const serviceOrder = route ? getServiceOrderById(db, route.serviceOrderId) : undefined;
    return request.items
      .filter((item) => item.destination === 'PROCURE' && item.status !== 'RECEIVED')
      .map((item) => ({ request, item, route, serviceOrder }));
  });
}

export function getRouteMetrics(db: PreviewDatabase): RouteMetrics {
  const routes = db.routeSheets;
  const tasks = db.tasks.filter((task) => task.routeSheetId);
  return {
    total: routes.length,
    active: routes.filter((route) => ['APPROVED', 'IN_PROGRESS', 'IN_ANNEXES', 'IN_QUALITY'].includes(route.status)).length,
    pendingApproval: routes.filter((route) => route.status === 'PENDING_APPROVAL').length,
    inAnnexes: routes.filter((route) => route.status === 'IN_ANNEXES').length,
    inQuality: routes.filter((route) => route.status === 'IN_QUALITY').length,
    readyForDelivery: routes.filter((route) => route.status === 'READY_FOR_DELIVERY').length,
    delivered: routes.filter((route) => route.status === 'DELIVERED').length,
    critical: routes.filter((route) => route.priority === 'CRITICAL' && route.status !== 'DELIVERED').length,
    totalTasks: tasks.length,
    completedTasks: tasks.filter((task) => task.status === 'COMPLETED').length,
  };
}

export function getInspectionMetrics(db: PreviewDatabase): InspectionMetrics {
  const inspections = db.inspections;
  return {
    total: inspections.length,
    open: inspections.filter((inspection) => inspection.status === 'OPEN').length,
    inProgress: inspections.filter((inspection) => inspection.status === 'IN_PROGRESS').length,
    completed: inspections.filter((inspection) => inspection.status === 'COMPLETED').length,
    approved: inspections.filter((inspection) => inspection.status === 'APPROVED').length,
    rejected: inspections.filter((inspection) => inspection.status === 'REJECTED').length,
  };
}

export function getServiceOrderMetrics(db: PreviewDatabase): ServiceOrderMetrics {
  const orders = getServiceOrdersWithRelations(db);
  return {
    total: orders.length,
    received: orders.filter((order) => order.status === 'RECEIVED').length,
    inInspection: orders.filter((order) => order.status === 'IN_INSPECTION').length,
    inRoute: orders.filter((order) => ['INSPECTION_APPROVED', 'IN_ROUTE'].includes(order.status)).length,
    inExecution: orders.filter((order) => order.status === 'IN_EXECUTION').length,
    inAnnexes: orders.filter((order) => order.status === 'IN_ANNEXES').length,
    inQuality: orders.filter((order) => order.status === 'IN_QUALITY').length,
    readyForDelivery: orders.filter((order) => order.status === 'READY_FOR_DELIVERY').length,
    delivered: orders.filter((order) => order.status === 'DELIVERED').length,
    critical: orders.filter((order) => order.priority === 'CRITICAL' && !['DELIVERED', 'CANCELLED'].includes(order.status)).length,
  };
}

export function getProcessWorkloadData(db: PreviewDatabase): Array<{
  processId: string;
  name: string;
  value: number;
  color: string;
}> {
  return PROCESSES.map((process: Process) => ({
    processId: process.id,
    name: process.shortName,
    value: db.tasks.filter(
      (task) => task.processId === process.id && task.status !== 'COMPLETED',
    ).length,
    color: process.color,
  }));
}

export function getProcessPerformanceData(db: PreviewDatabase): Array<{
  processId: string;
  name: string;
  hours: number;
  completed: number;
  color: string;
}> {
  return PROCESSES.map((process) => {
    const completed = db.tasks.filter(
      (task) => task.processId === process.id && task.status === 'COMPLETED',
    );
    const durations = completed
      .filter((task) => task.startedAt && task.completedAt)
      .map((task) => {
        const start = new Date(task.startedAt as string).getTime();
        const end = new Date(task.completedAt as string).getTime();
        return Math.max(0.1, (end - start) / 3600000);
      });
    const hours = durations.length
      ? Math.round((durations.reduce((sum, value) => sum + value, 0) / durations.length) * 10) / 10
      : 0;
    return {
      processId: process.id,
      name: process.shortName,
      hours,
      completed: completed.length,
      color: process.color,
    };
  });
}

export function getRouteStatusChartData(db: PreviewDatabase) {
  const labels: Record<string, string> = {
    DRAFT: 'Borrador',
    PENDING_APPROVAL: 'Por aprobar',
    APPROVED: 'Aprobada',
    IN_PROGRESS: 'Ejecución',
    IN_ANNEXES: 'Anexos',
    IN_QUALITY: 'Calidad',
    READY_FOR_DELIVERY: 'Por entregar',
    DELIVERED: 'Entregada',
  };
  return ROUTE_STATUS_ORDER.map((status) => ({
    status,
    name: labels[status],
    value: db.routeSheets.filter((route) => route.status === status).length,
  }));
}

export function getSalesStatusData(db: PreviewDatabase) {
  const statuses: Array<{ name: string; color: string; matches: string[] }> = [
    { name: 'Recibidas', color: '#64748b', matches: ['RECEIVED'] },
    { name: 'En inspección', color: '#38bdf8', matches: ['IN_INSPECTION'] },
    { name: 'En hoja de ruta', color: '#a78bfa', matches: ['INSPECTION_APPROVED', 'IN_ROUTE'] },
    { name: 'En ejecución', color: '#00d1ff', matches: ['IN_EXECUTION'] },
    { name: 'En calidad', color: '#ffb020', matches: ['IN_ANNEXES', 'IN_QUALITY'] },
    { name: 'Por entregar', color: '#22c55e', matches: ['READY_FOR_DELIVERY'] },
    { name: 'Entregadas', color: '#3b82f6', matches: ['DELIVERED'] },
  ];
  const orders = getServiceOrdersWithRelations(db);
  return statuses.map((status) => ({
    name: status.name,
    value: orders.filter((order) => status.matches.includes(order.status)).length,
    color: status.color,
  }));
}

export function getUpcomingDeliveries(db: PreviewDatabase) {
  return getRouteSheetsWithRelations(db)
    .filter((route) =>
      ['APPROVED', 'IN_PROGRESS', 'IN_ANNEXES', 'IN_QUALITY', 'READY_FOR_DELIVERY'].includes(route.status),
    )
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 8);
}

export function getClientVolumeData(db: PreviewDatabase) {
  return db.clients
    .map((client) => ({
      clientId: client.id,
      name: client.name,
      value: db.serviceOrders.filter((order) => order.clientId === client.id).length,
    }))
    .filter((entry) => entry.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}

export function getCalibrationItems(db: PreviewDatabase) {
  return db.inventory
    .filter((item) => item.calibrationDue)
    .map((item) => {
      const due = new Date(item.calibrationDue as string).getTime();
      const days = Math.ceil((due - Date.now()) / 86400000);
      const status: 'VALID' | 'DUE_SOON' | 'EXPIRED' =
        days < 0 ? 'EXPIRED' : days <= 30 ? 'DUE_SOON' : 'VALID';
      return { item, days, status };
    })
    .sort((a, b) => a.days - b.days);
}

export function getRecentAudit(db: PreviewDatabase, limit = 12) {
  return [...db.audit]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export function getProjectsWithRelations(db: PreviewDatabase) {
  return db.projects.map((project) => ({
    ...project,
    client: getClientById(db, project.clientId),
    owner: getUserById(db, project.ownerId),
  }));
}

export function getProjectById(db: PreviewDatabase, id: string) {
  return getProjectsWithRelations(db).find((project) => project.id === id);
}
