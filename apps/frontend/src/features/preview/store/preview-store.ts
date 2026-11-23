import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { seedDatabase } from '../data/seed';
import type {
  AuditAction,
  Inspection,
  InspectionStatus,
  InventoryItem,
  NewClientInput,
  NewInspectionInput,
  NewInventoryItemInput,
  NewLoanInput,
  NewProjectInput,
  NewRouteSheetInput,
  NewServiceOrderInput,
  NewSpareRequestInput,
  NewTaskInput,
  NewUserInput,
  PreviewDatabase,
  RouteSheet,
  RouteStatus,
  ServiceOrder,
  SpareItemStatus,
  Task,
  TaskStatus,
} from '../types';

function makeId(prefix: string): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${random}`;
}

function actorName(db: PreviewDatabase, actorId: string): string {
  return db.users.find((user) => user.id === actorId)?.name ?? 'Sistema';
}

function pushAudit(
  db: PreviewDatabase,
  actorId: string,
  action: AuditAction,
  entity: string,
  entityId: string,
  detail: string,
  createdAt = new Date().toISOString(),
): PreviewDatabase {
  return {
    ...db,
    audit: [
      {
        id: makeId('audit'),
        userId: actorId,
        userName: actorName(db, actorId),
        action,
        entity,
        entityId,
        detail,
        createdAt,
      },
      ...db.audit,
    ],
  };
}

function nextSequence(values: string[], prefix: string): number {
  const highest = values
    .filter((value) => value.startsWith(prefix))
    .map((value) => Number(value.replace(prefix, '')))
    .filter((value) => Number.isFinite(value))
    .reduce((max, value) => Math.max(max, value), 0);
  return highest + 1;
}

function nextRouteCode(db: PreviewDatabase): string {
  const year = new Date().getFullYear();
  const prefix = `HR-${year}-`;
  return `${prefix}${String(nextSequence(db.routeSheets.map((route) => route.code), prefix)).padStart(3, '0')}`;
}

function nextInspectionCode(db: PreviewDatabase): string {
  const year = new Date().getFullYear();
  const prefix = `INS-${year}-`;
  return `${prefix}${String(nextSequence(db.inspections.map((inspection) => inspection.code), prefix)).padStart(3, '0')}`;
}

function nextServiceOrderCode(db: PreviewDatabase, sub = false): string {
  const prefix = sub ? '52-' : '51-';
  return `${prefix}${String(nextSequence(db.serviceOrders.map((order) => (sub ? order.subCode : order.code)), prefix)).padStart(4, '0')}`;
}

function nextSpareCode(db: PreviewDatabase): string {
  const year = new Date().getFullYear();
  const prefix = `REP-${year}-`;
  return `${prefix}${String(nextSequence(db.spareRequests.map((request) => request.code), prefix)).padStart(3, '0')}`;
}

/**
 * Regla de desbloqueo:
 * - Una etapa se desbloquea cuando TODAS las tareas de las etapas anteriores están completadas.
 * - Las tareas completadas no se tocan.
 * - Si `unlocked` es false (hoja en borrador o pendiente de aprobación), todo lo no completado queda bloqueado.
 */
function normalizeTasks(tasks: Task[], unlocked: boolean): Task[] {
  const stages = [...new Set(tasks.map((task) => task.stage))].sort((a, b) => a - b);
  const stageComplete = new Map(
    stages.map((stage) => [
      stage,
      tasks.filter((task) => task.stage === stage).every((task) => task.status === 'COMPLETED'),
    ]),
  );

  return tasks.map((task) => {
    if (task.status === 'COMPLETED') return task;
    if (!unlocked) return { ...task, status: 'BLOCKED' as TaskStatus };
    const previousStages = stages.filter((stage) => stage < task.stage);
    const previousComplete = previousStages.every((stage) => stageComplete.get(stage));
    if (!previousComplete) return { ...task, status: 'BLOCKED' as TaskStatus };
    return {
      ...task,
      status: task.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : ('PENDING' as TaskStatus),
    };
  });
}

function routeTasks(db: PreviewDatabase, routeId: string): Task[] {
  return db.tasks.filter((task) => task.routeSheetId === routeId);
}

function inspectionTasks(db: PreviewDatabase, inspectionId: string): Task[] {
  return db.tasks.filter((task) => task.inspectionId === inspectionId);
}

function replaceTasks(db: PreviewDatabase, updates: Task[]): PreviewDatabase {
  const byId = new Map(updates.map((task) => [task.id, task]));
  return {
    ...db,
    tasks: db.tasks.map((task) => byId.get(task.id) ?? task),
  };
}

function checkInspectionCompletion(tasks: Task[]): InspectionStatus {
  return tasks.length > 0 && tasks.every((task) => task.status === 'COMPLETED')
    ? 'COMPLETED'
    : 'IN_PROGRESS';
}

function checkRouteCompletion(tasks: Task[]): RouteStatus | null {
  return tasks.length > 0 && tasks.every((task) => task.status === 'COMPLETED')
    ? 'IN_ANNEXES'
    : null;
}

interface PreviewActions {
  resetPreview: () => void;
  logLogin: (actorId: string) => void;

  createServiceOrder: (input: NewServiceOrderInput, actorId: string) => string;
  updateServiceOrder: (id: string, input: NewServiceOrderInput, actorId: string) => void;
  cancelServiceOrder: (id: string, actorId: string) => void;

  createInspection: (input: NewInspectionInput, actorId: string) => string;
  updateInspection: (id: string, findings: string, actorId: string) => void;
  addInspectionTask: (inspectionId: string, input: NewTaskInput, actorId: string) => void;
  deleteInspectionTask: (inspectionId: string, taskId: string, actorId: string) => void;
  approveInspection: (id: string, actorId: string) => void;
  rejectInspection: (id: string, actorId: string, reason: string) => void;

  createRouteSheet: (input: NewRouteSheetInput, actorId: string) => string;
  updateRouteSheet: (id: string, input: NewRouteSheetInput, actorId: string) => void;
  deleteRouteSheet: (id: string, actorId: string) => void;
  sendRouteToApproval: (id: string, actorId: string) => void;
  approveRouteSheet: (id: string, actorId: string) => void;
  rejectRouteSheet: (id: string, actorId: string, reason: string) => void;
  addRouteTask: (routeId: string, input: NewTaskInput, actorId: string) => void;
  replaceRouteTasks: (routeId: string, tasks: NewTaskInput[], actorId: string) => void;
  deleteRouteTask: (routeId: string, taskId: string, actorId: string) => void;
  toggleAnnex: (taskId: string, selected: boolean, actorId: string) => void;
  finalizeAnnexes: (id: string, actorId: string) => void;
  approveQuality: (id: string, actorId: string, observations?: string) => void;
  rejectQuality: (id: string, actorId: string, observations: string) => void;
  deliverRouteSheet: (id: string, actorId: string) => void;

  completeTask: (
    taskId: string,
    actorId: string,
    payload: { observations?: string; evidence?: string },
  ) => void;

  createSpareRequest: (routeId: string, input: NewSpareRequestInput, actorId: string) => void;
  updateSpareItemStatus: (
    requestId: string,
    itemId: string,
    status: SpareItemStatus,
    actorId: string,
  ) => void;

  addInventoryItem: (input: NewInventoryItemInput, actorId: string) => void;
  deleteInventoryItem: (itemId: string, actorId: string) => void;
  createLoan: (input: NewLoanInput, actorId: string) => void;
  returnLoan: (loanId: string, actorId: string) => void;
  calibrateInventoryItem: (id: string, dueDate: string, certificate: string, actorId: string) => void;

  createUser: (input: NewUserInput, actorId: string) => void;
  deleteUser: (userId: string, actorId: string) => void;
  createClient: (input: NewClientInput, actorId: string) => void;
  createProject: (input: NewProjectInput, actorId: string) => void;
}

interface PreviewStore extends PreviewActions {
  db: PreviewDatabase;
}

function buildTask(
  input: NewTaskInput,
  owner: { inspectionId?: string; routeSheetId?: string; source: 'INSPECTION' | 'ROUTE' },
  step: number,
  status: TaskStatus,
): Task {
  return {
    id: makeId('task'),
    inspectionId: owner.inspectionId,
    routeSheetId: owner.routeSheetId,
    source: owner.source,
    step,
    stage: input.stage,
    processId: input.processId,
    positionId: input.positionId,
    assignedUserId: input.assignedUserId,
    description: input.description,
    criteria: input.criteria,
    forms: input.forms,
    status,
  };
}

export const usePreviewStore = create<PreviewStore>()(
  persist(
    (set) => ({
      db: seedDatabase(),

      resetPreview: () => {
        set({ db: seedDatabase() });
      },

      logLogin: (actorId) => {
        set((state) => ({
          db: pushAudit(state.db, actorId, 'LOGIN', 'Sesión', 'preview', 'Ingreso al sistema CAMI.'),
        }));
      },

      createServiceOrder: (input, actorId) => {
        const id = makeId('so');
        set((state) => {
          const now = new Date().toISOString();
          const code = input.code.trim() || nextServiceOrderCode(state.db);
          const subCode = input.subCode.trim() || nextServiceOrderCode(state.db, true);
          const order: ServiceOrder = {
            id,
            code,
            subCode,
            clientId: input.clientId,
            assetId: input.assetId,
            equipmentCode: input.equipmentCode,
            description: input.description,
            scope: input.scope,
            priority: input.priority,
            dueDate: input.dueDate,
            site: input.site,
            createdBy: actorId,
            createdAt: now,
            updatedAt: now,
            observations: input.observations,
          };
          const db = pushAudit(
            { ...state.db, serviceOrders: [order, ...state.db.serviceOrders] },
            actorId,
            'CREATE',
            'Orden de servicio',
            code,
            `Orden de servicio creada para ${state.db.clients.find((client) => client.id === input.clientId)?.name ?? 'cliente'}.`,
          );
          return { db };
        });
        return id;
      },

      updateServiceOrder: (id, input, actorId) => {
        set((state) => {
          const current = state.db.serviceOrders.find((order) => order.id === id);
          if (!current) return state;
          const db = pushAudit(
            {
              ...state.db,
              serviceOrders: state.db.serviceOrders.map((order) =>
                order.id === id
                  ? {
                      ...order,
                      ...input,
                      updatedAt: new Date().toISOString(),
                    }
                  : order,
              ),
            },
            actorId,
            'UPDATE',
            'Orden de servicio',
            current.code,
            'Datos generales de la orden actualizados.',
          );
          return { db };
        });
      },

      cancelServiceOrder: (id, actorId) => {
        set((state) => {
          const current = state.db.serviceOrders.find((order) => order.id === id);
          if (!current) return state;
          const db = pushAudit(
            {
              ...state.db,
              serviceOrders: state.db.serviceOrders.map((order) =>
                order.id === id ? { ...order, cancelledAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : order,
              ),
            },
            actorId,
            'REJECT',
            'Orden de servicio',
            current.code,
            'Orden de servicio cancelada.',
          );
          return { db };
        });
      },

      createInspection: (input, actorId) => {
        const id = makeId('insp');
        set((state) => {
          const order = state.db.serviceOrders.find((item) => item.id === input.serviceOrderId);
          if (!order) return state;
          if (order.inspectionId) {
            const existing = state.db.inspections.find((item) => item.id === order.inspectionId);
            if (existing && existing.status !== 'REJECTED') return state;
          }
          const now = new Date().toISOString();
          const tasks = input.tasks.map((task, index) =>
            buildTask(
              task,
              { inspectionId: id, source: 'INSPECTION' },
              (index + 1) * 10,
              index === 0 ? 'PENDING' : 'BLOCKED',
            ),
          );
          const normalized = normalizeTasks(tasks, true);
          const inspection: Inspection = {
            id,
            code: nextInspectionCode(state.db),
            serviceOrderId: input.serviceOrderId,
            status: normalized.length ? checkInspectionCompletion(normalized) : 'OPEN',
            findings: input.findings,
            createdBy: actorId,
            createdAt: now,
            updatedAt: now,
          };
          const db = pushAudit(
            {
              ...state.db,
              inspections: [inspection, ...state.db.inspections],
              tasks: [...state.db.tasks, ...normalized],
              serviceOrders: state.db.serviceOrders.map((item) =>
                item.id === order.id ? { ...item, inspectionId: id, updatedAt: now } : item,
              ),
            },
            actorId,
            'CREATE',
            'Inspección',
            inspection.code,
            `Inspección creada desde la ODS ${order.code}.`,
          );
          return { db };
        });
        return id;
      },

      updateInspection: (id, findings, actorId) => {
        set((state) => {
          const current = state.db.inspections.find((inspection) => inspection.id === id);
          if (!current) return state;
          const db = pushAudit(
            {
              ...state.db,
              inspections: state.db.inspections.map((inspection) =>
                inspection.id === id
                  ? { ...inspection, findings, updatedAt: new Date().toISOString() }
                  : inspection,
              ),
            },
            actorId,
            'UPDATE',
            'Inspección',
            current.code,
            'Hallazgos de la inspección actualizados.',
          );
          return { db };
        });
      },

      addInspectionTask: (inspectionId, input, actorId) => {
        set((state) => {
          const inspection = state.db.inspections.find((item) => item.id === inspectionId);
          if (!inspection || inspection.status === 'APPROVED') return state;
          const existing = inspectionTasks(state.db, inspectionId);
          const maxStep = existing.reduce((max, task) => Math.max(max, task.step), 0);
          const task = buildTask(
            input,
            { inspectionId, source: 'INSPECTION' },
            maxStep + 10,
            'BLOCKED',
          );
          const normalized = normalizeTasks([...existing, task], true);
          const db = pushAudit(
            {
              ...state.db,
              tasks: [...state.db.tasks, task],
              inspections: state.db.inspections.map((item) =>
                item.id === inspectionId
                  ? { ...item, status: checkInspectionCompletion(normalized), updatedAt: new Date().toISOString() }
                  : item,
              ),
            },
            actorId,
            'CREATE',
            'Tarea de inspección',
            inspection.code,
            `Tarea agregada: ${input.description}`,
          );
          return { db: replaceTasks(db, normalized) };
        });
      },

      deleteInspectionTask: (inspectionId, taskId, actorId) => {
        set((state) => {
          const inspection = state.db.inspections.find((item) => item.id === inspectionId);
          if (!inspection || inspection.status === 'APPROVED') return state;
          const remaining = inspectionTasks(state.db, inspectionId).filter((task) => task.id !== taskId);
          const normalized = normalizeTasks(remaining, true);
          const db = pushAudit(
            {
              ...state.db,
              tasks: state.db.tasks.filter((task) => task.id !== taskId),
              inspections: state.db.inspections.map((item) =>
                item.id === inspectionId
                  ? { ...item, status: checkInspectionCompletion(normalized), updatedAt: new Date().toISOString() }
                  : item,
              ),
            },
            actorId,
            'DELETE',
            'Tarea de inspección',
            inspection.code,
            'Tarea de inspección eliminada.',
          );
          return { db: replaceTasks(db, normalized) };
        });
      },

      approveInspection: (id, actorId) => {
        set((state) => {
          const inspection = state.db.inspections.find((item) => item.id === id);
          if (!inspection || inspection.status === 'APPROVED') return state;
          const tasks = inspectionTasks(state.db, id);
          if (tasks.some((task) => task.status !== 'COMPLETED')) return state;
          const db = pushAudit(
            {
              ...state.db,
              inspections: state.db.inspections.map((item) =>
                item.id === id
                  ? {
                      ...item,
                      status: 'APPROVED',
                      approvedBy: actorId,
                      approvedAt: new Date().toISOString(),
                      rejectedReason: undefined,
                      updatedAt: new Date().toISOString(),
                    }
                  : item,
              ),
            },
            actorId,
            'APPROVE',
            'Inspección',
            inspection.code,
            'Inspección aprobada y disponible para Ingeniería.',
          );
          return { db };
        });
      },

      rejectInspection: (id, actorId, reason) => {
        set((state) => {
          const inspection = state.db.inspections.find((item) => item.id === id);
          if (!inspection || inspection.status === 'APPROVED') return state;
          const currentTasks = inspectionTasks(state.db, id);
          const allCompleted = currentTasks.length > 0 && currentTasks.every((task) => task.status === 'COMPLETED');
          const maxStage = currentTasks.reduce((max, task) => Math.max(max, task.stage), 0);
          const reopened = allCompleted
            ? currentTasks.map((task) =>
                task.stage === maxStage
                  ? { ...task, status: 'PENDING' as TaskStatus, completedAt: undefined, completedBy: undefined }
                  : task,
              )
            : currentTasks;
          const tasks = normalizeTasks(reopened, true);
          const db = pushAudit(
            {
              ...state.db,
              tasks: state.db.tasks.map((task) => tasks.find((item) => item.id === task.id) ?? task),
              inspections: state.db.inspections.map((item) =>
                item.id === id
                  ? {
                      ...item,
                      status: 'REJECTED',
                      rejectedReason: reason,
                      approvedBy: undefined,
                      approvedAt: undefined,
                      updatedAt: new Date().toISOString(),
                    }
                  : item,
              ),
            },
            actorId,
            'REJECT',
            'Inspección',
            inspection.code,
            `Inspección rechazada: ${reason}`,
          );
          return { db };
        });
      },

      createRouteSheet: (input, actorId) => {
        const id = makeId('route');
        set((state) => {
          const inspection = state.db.inspections.find((item) => item.id === input.inspectionId);
          if (!inspection || inspection.status !== 'APPROVED') return state;
          const order = state.db.serviceOrders.find((item) => item.id === inspection.serviceOrderId);
          if (!order) return state;
          const now = new Date().toISOString();
          const inspectionTaskList = inspectionTasks(state.db, inspection.id);
          const copied = inspectionTaskList.map((task, index) => ({
            ...task,
            id: makeId('task'),
            inspectionId: undefined,
            routeSheetId: id,
            source: 'INSPECTION' as const,
            sourceTaskId: task.id,
            status: 'COMPLETED' as TaskStatus,
            annexSelected: false,
            step: (index + 1) * 10,
          }));
          const startStep = copied.reduce((max, task) => Math.max(max, task.step), 0) + 10;
          const created = input.tasks.map((task, index) =>
            buildTask(
              task,
              { routeSheetId: id, source: 'ROUTE' },
              startStep + index * 10,
              'BLOCKED',
            ),
          );
          const allTasks = normalizeTasks([...copied, ...created], false);
          const route: RouteSheet = {
            id,
            code: nextRouteCode(state.db),
            serviceOrderId: order.id,
            inspectionId: inspection.id,
            description: input.description,
            serial: input.serial,
            equipmentCode: input.equipmentCode,
            site: input.site,
            scope: input.scope,
            priority: input.priority,
            dueDate: input.dueDate,
            status: 'DRAFT',
            createdBy: actorId,
            createdAt: now,
            updatedAt: now,
            preparedBy: actorId,
            preparedAt: now,
            observations: input.observations,
            aiDraftUsed: input.aiDraftUsed,
          };
          const db = pushAudit(
            {
              ...state.db,
              routeSheets: [route, ...state.db.routeSheets],
              tasks: [...state.db.tasks, ...allTasks],
              serviceOrders: state.db.serviceOrders.map((item) =>
                item.id === order.id ? { ...item, routeSheetId: id, updatedAt: now } : item,
              ),
            },
            actorId,
            'CREATE',
            'Hoja de ruta',
            route.code,
            `Hoja de ruta creada desde la inspección ${inspection.code}${input.aiDraftUsed ? ' con asistencia de IA' : ''}.`,
          );
          return { db };
        });
        return id;
      },

      updateRouteSheet: (id, input, actorId) => {
        set((state) => {
          const route = state.db.routeSheets.find((item) => item.id === id);
          if (!route || !['DRAFT', 'IN_ANNEXES', 'IN_QUALITY'].includes(route.status)) return state;
          const db = pushAudit(
            {
              ...state.db,
              routeSheets: state.db.routeSheets.map((item) =>
                item.id === id
                  ? {
                      ...item,
                      description: input.description,
                      serial: input.serial,
                      equipmentCode: input.equipmentCode,
                      site: input.site,
                      scope: input.scope,
                      priority: input.priority,
                      dueDate: input.dueDate,
                      observations: input.observations,
                      aiDraftUsed: item.aiDraftUsed || input.aiDraftUsed,
                      updatedAt: new Date().toISOString(),
                    }
                  : item,
              ),
            },
            actorId,
            'UPDATE',
            'Hoja de ruta',
            route.code,
            'Cabezal y datos generales actualizados.',
          );
          return { db };
        });
      },

      deleteRouteSheet: (id, actorId) => {
        set((state) => {
          const route = state.db.routeSheets.find((item) => item.id === id);
          if (!route || route.status !== 'DRAFT') return state;
          const db = pushAudit(
            {
              ...state.db,
              routeSheets: state.db.routeSheets.filter((item) => item.id !== id),
              tasks: state.db.tasks.filter((task) => task.routeSheetId !== id),
              spareRequests: state.db.spareRequests.filter((request) => request.routeSheetId !== id),
              serviceOrders: state.db.serviceOrders.map((order) =>
                order.id === route.serviceOrderId ? { ...order, routeSheetId: undefined } : order,
              ),
            },
            actorId,
            'DELETE',
            'Hoja de ruta',
            route.code,
            'Hoja de ruta eliminada en borrador.',
          );
          return { db };
        });
      },

      sendRouteToApproval: (id, actorId) => {
        set((state) => {
          const route = state.db.routeSheets.find((item) => item.id === id);
          if (!route || route.status !== 'DRAFT') return state;
          const db = pushAudit(
            {
              ...state.db,
              routeSheets: state.db.routeSheets.map((item) =>
                item.id === id
                  ? { ...item, status: 'PENDING_APPROVAL', updatedAt: new Date().toISOString() }
                  : item,
              ),
            },
            actorId,
            'UPDATE',
            'Hoja de ruta',
            route.code,
            'Hoja enviada al Gerente para aprobación.',
          );
          return { db };
        });
      },

      approveRouteSheet: (id, actorId) => {
        set((state) => {
          const route = state.db.routeSheets.find((item) => item.id === id);
          if (!route || route.status !== 'PENDING_APPROVAL') return state;
          const normalized = normalizeTasks(routeTasks(state.db, id), true);
          const db = pushAudit(
            {
              ...state.db,
              tasks: state.db.tasks.map((task) => normalized.find((item) => item.id === task.id) ?? task),
              routeSheets: state.db.routeSheets.map((item) =>
                item.id === id
                  ? {
                      ...item,
                      status: 'APPROVED',
                      approvedBy: actorId,
                      approvedAt: new Date().toISOString(),
                      rejectedReason: undefined,
                      updatedAt: new Date().toISOString(),
                    }
                  : item,
              ),
            },
            actorId,
            'APPROVE',
            'Hoja de ruta',
            route.code,
            'Hoja aprobada y liberada a taller.',
          );
          return { db };
        });
      },

      rejectRouteSheet: (id, actorId, reason) => {
        set((state) => {
          const route = state.db.routeSheets.find((item) => item.id === id);
          if (!route || route.status !== 'PENDING_APPROVAL') return state;
          const normalized = normalizeTasks(routeTasks(state.db, id), false);
          const db = pushAudit(
            {
              ...state.db,
              tasks: state.db.tasks.map((task) => normalized.find((item) => item.id === task.id) ?? task),
              routeSheets: state.db.routeSheets.map((item) =>
                item.id === id
                  ? {
                      ...item,
                      status: 'DRAFT',
                      rejectedReason: reason,
                      approvedBy: undefined,
                      approvedAt: undefined,
                      updatedAt: new Date().toISOString(),
                    }
                  : item,
              ),
            },
            actorId,
            'REJECT',
            'Hoja de ruta',
            route.code,
            `Hoja devuelta a Ingeniería: ${reason}`,
          );
          return { db };
        });
      },

      addRouteTask: (routeId, input, actorId) => {
        set((state) => {
          const route = state.db.routeSheets.find((item) => item.id === routeId);
          if (!route) return state;
          if (!['DRAFT', 'IN_ANNEXES', 'IN_QUALITY', 'IN_PROGRESS'].includes(route.status)) return state;
          const existing = routeTasks(state.db, routeId);
          const maxStep = existing.reduce((max, task) => Math.max(max, task.step), 0);
          const unlocked = !['DRAFT', 'PENDING_APPROVAL'].includes(route.status);
          const task = buildTask(
            input,
            { routeSheetId: routeId, source: 'ROUTE' },
            maxStep + 10,
            unlocked ? 'PENDING' : 'BLOCKED',
          );
          const normalized = normalizeTasks([...existing, task], unlocked);
          const reopening = ['IN_ANNEXES', 'IN_QUALITY'].includes(route.status);
          const db = pushAudit(
            {
              ...state.db,
              tasks: [...state.db.tasks, task],
              routeSheets: state.db.routeSheets.map((item) =>
                item.id === routeId
                  ? {
                      ...item,
                      status: reopening ? 'IN_PROGRESS' : item.status,
                      annexFinalizedAt: reopening ? undefined : item.annexFinalizedAt,
                      annexFinalizedBy: reopening ? undefined : item.annexFinalizedBy,
                      qualityApprovedAt: reopening ? undefined : item.qualityApprovedAt,
                      qualityApprovedBy: reopening ? undefined : item.qualityApprovedBy,
                      updatedAt: new Date().toISOString(),
                    }
                  : item,
              ),
            },
            actorId,
            'CREATE',
            'Tarea de hoja de ruta',
            route.code,
            `Tarea agregada: ${input.description}`,
          );
          return { db: replaceTasks(db, normalized) };
        });
      },

      replaceRouteTasks: (routeId, inputTasks, actorId) => {
        set((state) => {
          const route = state.db.routeSheets.find((item) => item.id === routeId);
          if (!route || route.status !== 'DRAFT') return state;
          const existing = routeTasks(state.db, routeId);
          const copied = existing.filter((task) => task.source === 'INSPECTION');
          const startStep = copied.reduce((max, task) => Math.max(max, task.step), 0) + 10;
          const created = inputTasks.map((task, index) =>
            buildTask(
              task,
              { routeSheetId: routeId, source: 'ROUTE' },
              startStep + index * 10,
              'BLOCKED',
            ),
          );
          const normalized = normalizeTasks([...copied, ...created], false);
          const db = pushAudit(
            {
              ...state.db,
              tasks: [
                ...state.db.tasks.filter(
                  (task) => task.routeSheetId !== routeId || task.source !== 'ROUTE',
                ),
                ...created,
              ],
              routeSheets: state.db.routeSheets.map((item) =>
                item.id === routeId ? { ...item, updatedAt: new Date().toISOString() } : item,
              ),
            },
            actorId,
            'UPDATE',
            'Tareas de hoja de ruta',
            route.code,
            'Tareas de la hoja de ruta actualizadas.',
          );
          return { db: replaceTasks(db, normalized) };
        });
      },

      deleteRouteTask: (routeId, taskId, actorId) => {
        set((state) => {
          const route = state.db.routeSheets.find((item) => item.id === routeId);
          const task = state.db.tasks.find((item) => item.id === taskId);
          if (!route || !task || task.status === 'COMPLETED') return state;
          const remaining = routeTasks(state.db, routeId).filter((item) => item.id !== taskId);
          const unlocked = !['DRAFT', 'PENDING_APPROVAL'].includes(route.status);
          const normalized = normalizeTasks(remaining, unlocked);
          const db = pushAudit(
            {
              ...state.db,
              tasks: state.db.tasks.filter((item) => item.id !== taskId),
              routeSheets: state.db.routeSheets.map((item) =>
                item.id === routeId ? { ...item, updatedAt: new Date().toISOString() } : item,
              ),
            },
            actorId,
            'DELETE',
            'Tarea de hoja de ruta',
            route.code,
            'Tarea eliminada de la hoja de ruta.',
          );
          return { db: replaceTasks(db, normalized) };
        });
      },

      toggleAnnex: (taskId, selected, actorId) => {
        set((state) => ({
          db: pushAudit(
            {
              ...state.db,
              tasks: state.db.tasks.map((task) =>
                task.id === taskId ? { ...task, annexSelected: selected } : task,
              ),
            },
            actorId,
            'UPDATE',
            'Anexo',
            taskId,
            selected ? 'Evidencia incluida en los anexos.' : 'Evidencia excluida de los anexos.',
          ),
        }));
      },

      finalizeAnnexes: (id, actorId) => {
        set((state) => {
          const route = state.db.routeSheets.find((item) => item.id === id);
          if (!route || route.status !== 'IN_ANNEXES') return state;
          const db = pushAudit(
            {
              ...state.db,
              routeSheets: state.db.routeSheets.map((item) =>
                item.id === id
                  ? {
                      ...item,
                      status: 'IN_QUALITY',
                      annexFinalizedBy: actorId,
                      annexFinalizedAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    }
                  : item,
              ),
            },
            actorId,
            'APPROVE',
            'Anexos',
            route.code,
            'Anexos finalizados y enviados a Calidad.',
          );
          return { db };
        });
      },

      approveQuality: (id, actorId, observations) => {
        set((state) => {
          const route = state.db.routeSheets.find((item) => item.id === id);
          if (!route || route.status !== 'IN_QUALITY') return state;
          const db = pushAudit(
            {
              ...state.db,
              routeSheets: state.db.routeSheets.map((item) =>
                item.id === id
                  ? {
                      ...item,
                      status: 'READY_FOR_DELIVERY',
                      qualityApprovedBy: actorId,
                      qualityApprovedAt: new Date().toISOString(),
                      observations: observations ?? item.observations,
                      updatedAt: new Date().toISOString(),
                    }
                  : item,
              ),
            },
            actorId,
            'APPROVE',
            'Calidad',
            route.code,
            'Visto bueno final de Calidad.',
          );
          return { db };
        });
      },

      rejectQuality: (id, actorId, observations) => {
        set((state) => {
          const route = state.db.routeSheets.find((item) => item.id === id);
          if (!route || route.status !== 'IN_QUALITY') return state;
          const db = pushAudit(
            {
              ...state.db,
              routeSheets: state.db.routeSheets.map((item) =>
                item.id === id
                  ? {
                      ...item,
                      status: 'IN_ANNEXES',
                      qualityApprovedBy: undefined,
                      qualityApprovedAt: undefined,
                      observations,
                      updatedAt: new Date().toISOString(),
                    }
                  : item,
              ),
            },
            actorId,
            'REJECT',
            'Calidad',
            route.code,
            `Calidad devolvió la hoja: ${observations}`,
          );
          return { db };
        });
      },

      deliverRouteSheet: (id, actorId) => {
        set((state) => {
          const route = state.db.routeSheets.find((item) => item.id === id);
          if (!route || route.status !== 'READY_FOR_DELIVERY') return state;
          const db = pushAudit(
            {
              ...state.db,
              routeSheets: state.db.routeSheets.map((item) =>
                item.id === id
                  ? { ...item, status: 'DELIVERED', deliveredAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
                  : item,
              ),
            },
            actorId,
            'DELIVER',
            'Hoja de ruta',
            route.code,
            'Entrega confirmada al cliente.',
          );
          return { db };
        });
      },

      completeTask: (taskId, actorId, payload) => {
        set((state) => {
          const task = state.db.tasks.find((item) => item.id === taskId);
          if (!task) return state;
          const now = new Date().toISOString();
          const completedTask: Task = {
            ...task,
            status: 'COMPLETED',
            observations: payload.observations ?? task.observations,
            evidence: payload.evidence ?? task.evidence,
            startedAt: task.startedAt ?? now,
            completedAt: now,
            completedBy: actorId,
          };

          if (task.inspectionId) {
            const inspection = state.db.inspections.find((item) => item.id === task.inspectionId);
            if (!inspection) return state;
            const updatedTasks = inspectionTasks(state.db, inspection.id).map((item) =>
              item.id === taskId ? completedTask : item,
            );
            const normalized = normalizeTasks(updatedTasks, true);
            const db = pushAudit(
              {
                ...state.db,
                tasks: state.db.tasks.map((item) => normalized.find((next) => next.id === item.id) ?? item),
                inspections: state.db.inspections.map((item) =>
                  item.id === inspection.id
                    ? {
                        ...item,
                        status: checkInspectionCompletion(normalized),
                        updatedAt: now,
                      }
                    : item,
                ),
              },
              actorId,
              'COMPLETE',
              'Tarea de inspección',
              inspection.code,
              `Tarea completada: ${task.description}`,
            );
            return { db };
          }

          if (task.routeSheetId) {
            const route = state.db.routeSheets.find((item) => item.id === task.routeSheetId);
            if (!route || ['DRAFT', 'PENDING_APPROVAL'].includes(route.status)) return state;
            const updatedTasks = routeTasks(state.db, route.id).map((item) =>
              item.id === taskId ? completedTask : item,
            );
            const unlocked = !['DRAFT', 'PENDING_APPROVAL'].includes(route.status);
            const normalized = normalizeTasks(updatedTasks, unlocked);
            const completedStatus = checkRouteCompletion(normalized);
            const nextStatus: RouteStatus =
              completedStatus ??
              (route.status === 'APPROVED' ? 'IN_PROGRESS' : route.status);
            const db = pushAudit(
              {
                ...state.db,
                tasks: state.db.tasks.map((item) => normalized.find((next) => next.id === item.id) ?? item),
                routeSheets: state.db.routeSheets.map((item) =>
                  item.id === route.id
                    ? { ...item, status: nextStatus, updatedAt: now }
                    : item,
                ),
              },
              actorId,
              'COMPLETE',
              'Tarea de hoja de ruta',
              route.code,
              `Tarea completada: ${task.description}`,
            );
            return { db };
          }

          return state;
        });
      },

      createSpareRequest: (routeId, input, actorId) => {
        set((state) => {
          const route = state.db.routeSheets.find((item) => item.id === routeId);
          if (!route) return state;
          const now = new Date().toISOString();
          const request = {
            id: makeId('spare'),
            code: nextSpareCode(state.db),
            routeSheetId: routeId,
            requestedBy: actorId,
            requestedAt: now,
            notes: input.notes,
            items: input.items.map((item) => {
              const inventoryItem = state.db.inventory.find(
                (candidate) => candidate.code.toLowerCase() === item.code.toLowerCase(),
              );
              const available = Boolean(
                inventoryItem && inventoryItem.quantity >= item.quantity && inventoryItem.status !== 'OUT_OF_STOCK',
              );
              return {
                id: makeId('spare-item'),
                name: item.name,
                code: item.code,
                quantity: item.quantity,
                destination: available ? ('WAREHOUSE' as const) : ('PROCURE' as const),
                status: available ? ('PENDING' as const) : ('IN_PROCURE' as const),
                available,
              };
            }),
          };
          const db = pushAudit(
            {
              ...state.db,
              spareRequests: [request, ...state.db.spareRequests],
            },
            actorId,
            'CREATE',
            'Solicitud de repuestos',
            request.code,
            `Solicitud de ${request.items.length} ítem(s) para ${route.code}.`,
          );
          return { db };
        });
      },

      updateSpareItemStatus: (requestId, itemId, status, actorId) => {
        set((state) => {
          const request = state.db.spareRequests.find((item) => item.id === requestId);
          if (!request) return state;
          const item = request.items.find((candidate) => candidate.id === itemId);
          if (!item) return state;

          let inventory = state.db.inventory;
          if (status === 'DISPATCHED' && item.destination === 'WAREHOUSE') {
            inventory = inventory.map((candidate) => {
              if (candidate.code.toLowerCase() !== item.code.toLowerCase()) return candidate;
              const quantity = Math.max(0, candidate.quantity - item.quantity);
              return {
                ...candidate,
                quantity,
                status: quantity === 0 ? 'OUT_OF_STOCK' : candidate.status,
              };
            });
          }
          if (status === 'RECEIVED' && item.destination === 'PROCURE') {
            const existing = inventory.find((candidate) => candidate.code.toLowerCase() === item.code.toLowerCase());
            if (existing) {
              inventory = inventory.map((candidate) =>
                candidate.id === existing.id
                  ? { ...candidate, quantity: candidate.quantity + item.quantity, status: 'AVAILABLE' }
                  : candidate,
              );
            } else {
              inventory = [
                ...inventory,
                {
                  id: makeId('inv'),
                  name: item.name,
                  code: item.code,
                  category: 'Procura',
                  quantity: item.quantity,
                  status: 'AVAILABLE',
                  location: 'Almacén',
                },
              ];
            }
          }

          const db = pushAudit(
            {
              ...state.db,
              inventory,
              spareRequests: state.db.spareRequests.map((candidate) =>
                candidate.id === requestId
                  ? {
                      ...candidate,
                      items: candidate.items.map((row) => (row.id === itemId ? { ...row, status } : row)),
                    }
                  : candidate,
              ),
            },
            actorId,
            status === 'DISPATCHED' ? 'DISPATCH' : 'UPDATE',
            'Solicitud de repuestos',
            request.code,
            `${item.name}: ${status}.`,
          );
          return { db };
        });
      },

      addInventoryItem: (input, actorId) => {
        set((state) => {
          const item: InventoryItem = {
            id: makeId('inv'),
            name: input.name,
            code: input.code,
            category: input.category,
            quantity: input.quantity,
            location: input.location,
            status: input.quantity > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK',
          };
          const db = pushAudit(
            { ...state.db, inventory: [item, ...state.db.inventory] },
            actorId,
            'CREATE',
            'Inventario',
            item.code,
            `Ítem agregado al inventario: ${item.name}.`,
          );
          return { db };
        });
      },

      deleteInventoryItem: (itemId, actorId) => {
        set((state) => {
          const item = state.db.inventory.find((candidate) => candidate.id === itemId);
          if (!item) return state;
          const db = pushAudit(
            { ...state.db, inventory: state.db.inventory.filter((candidate) => candidate.id !== itemId) },
            actorId,
            'DELETE',
            'Inventario',
            item.code,
            `Ítem eliminado del inventario: ${item.name}.`,
          );
          return { db };
        });
      },

      createLoan: (input, actorId) => {
        set((state) => {
          const item = state.db.inventory.find((candidate) => candidate.id === input.itemId);
          if (!item) return state;
          const loan = {
            id: makeId('loan'),
            itemId: input.itemId,
            receivedBy: input.receivedBy,
            authorizedBy: actorId,
            loanedAt: new Date().toISOString(),
            status: 'ACTIVE' as const,
          };
          const db = pushAudit(
            {
              ...state.db,
              loans: [loan, ...state.db.loans],
              inventory: state.db.inventory.map((candidate) =>
                candidate.id === input.itemId ? { ...candidate, status: 'LOANED' } : candidate,
              ),
            },
            actorId,
            'CREATE',
            'Préstamo',
            item.code,
            `Préstamo entregado a ${state.db.users.find((user) => user.id === input.receivedBy)?.name ?? 'usuario'}.`,
          );
          return { db };
        });
      },

      returnLoan: (loanId, actorId) => {
        set((state) => {
          const loan = state.db.loans.find((candidate) => candidate.id === loanId);
          if (!loan) return state;
          const item = state.db.inventory.find((candidate) => candidate.id === loan.itemId);
          const db = pushAudit(
            {
              ...state.db,
              loans: state.db.loans.map((candidate) =>
                candidate.id === loanId
                  ? { ...candidate, status: 'RETURNED', returnedAt: new Date().toISOString() }
                  : candidate,
              ),
              inventory: state.db.inventory.map((candidate) =>
                candidate.id === loan.itemId ? { ...candidate, status: 'AVAILABLE' } : candidate,
              ),
            },
            actorId,
            'UPDATE',
            'Préstamo',
            item?.code ?? loan.id,
            'Préstamo devuelto al almacén.',
          );
          return { db };
        });
      },

      calibrateInventoryItem: (id, dueDate, certificate, actorId) => {
        set((state) => {
          const item = state.db.inventory.find((candidate) => candidate.id === id);
          if (!item) return state;
          const db = pushAudit(
            {
              ...state.db,
              inventory: state.db.inventory.map((candidate) =>
                candidate.id === id
                  ? { ...candidate, calibrationDue: dueDate, certificate }
                  : candidate,
              ),
            },
            actorId,
            'UPDATE',
            'Calibración',
            item.code,
            `Calibración actualizada. Vence: ${dueDate}.`,
          );
          return { db };
        });
      },

      createUser: (input, actorId) => {
        set((state) => {
          const user = {
            id: makeId('user'),
            name: input.name,
            username: input.username,
            password: input.password,
            email: input.email,
            role: input.role,
            positionId: input.positionId,
            active: true,
            createdAt: new Date().toISOString(),
          };
          const db = pushAudit(
            { ...state.db, users: [...state.db.users, user] },
            actorId,
            'CREATE',
            'Usuario',
            input.username,
            `Usuario creado con rol ${input.role}.`,
          );
          return { db };
        });
      },

      deleteUser: (userId, actorId) => {
        set((state) => {
          const user = state.db.users.find((candidate) => candidate.id === userId);
          if (!user) return state;
          const db = pushAudit(
            { ...state.db, users: state.db.users.filter((candidate) => candidate.id !== userId) },
            actorId,
            'DELETE',
            'Usuario',
            user.username,
            `Usuario eliminado: ${user.name}.`,
          );
          return { db };
        });
      },

      createClient: (input, actorId) => {
        set((state) => {
          const client = { id: makeId('cli'), ...input };
          const db = pushAudit(
            { ...state.db, clients: [...state.db.clients, client] },
            actorId,
            'CREATE',
            'Cliente',
            client.code,
            `Cliente creado: ${client.name}.`,
          );
          return { db };
        });
      },

      createProject: (input, actorId) => {
        set((state) => {
          const project = {
            id: makeId('project'),
            name: input.name,
            clientId: input.clientId,
            ownerId: input.ownerId,
            phase: input.phase,
            progress: 0,
            startDate: input.startDate,
            dueDate: input.dueDate,
            milestones: [
              { id: makeId('pm'), name: 'Ingeniería', phase: 'ENGINEERING' as const, status: 'PENDING' as const },
              { id: makeId('pm'), name: 'Procura', phase: 'PROCUREMENT' as const, status: 'PENDING' as const },
              { id: makeId('pm'), name: 'Construcción', phase: 'CONSTRUCTION' as const, status: 'PENDING' as const },
              { id: makeId('pm'), name: 'Comisionamiento', phase: 'COMMISSIONING' as const, status: 'PENDING' as const },
            ],
          };
          const db = pushAudit(
            { ...state.db, projects: [project, ...state.db.projects] },
            actorId,
            'CREATE',
            'Proyecto',
            project.name,
            'Proyecto creado.',
          );
          return { db };
        });
      },
    }),
    { name: 'turbopre.cami.preview.v2' },
  ),
);
