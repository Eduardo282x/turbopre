import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { seedDatabase } from '../data/seed';
import type {
  AuditAction,
  AreaId,
  FieldJobStatus,
  InventoryStatus,
  NewClientInput,
  NewInventoryItemInput,
  NewLoanInput,
  NewNonConformityInput,
  NewPartInput,
  NewQualityRecordInput,
  NewRouteSheetInput,
  NewServiceOrderInput,
  NewSparePartInput,
  NewUserInput,
  NonConformityStatus,
  Part,
  Phase,
  PhaseType,
  PreviewDatabase,
  ProjectPhase,
  QualityResult,
  RouteStatus,
  ServiceOrderStatus,
  SparePartStatus,
  SupplyStatus,
} from '../types';

function makeId(prefix: string): string {
  const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${random}`;
}

function nextRouteCode(db: PreviewDatabase): string {
  const year = new Date().getFullYear();
  const prefix = `HR-${year}-`;
  const highest = db.routeSheets
    .map((route) => route.code)
    .filter((code) => code.startsWith(prefix))
    .map((code) => Number(code.replace(prefix, '')))
    .filter((value) => Number.isFinite(value))
    .reduce((max, value) => Math.max(max, value), 0);
  return `${prefix}${String(highest + 1).padStart(3, '0')}`;
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

function buildPhasesForPart(
  db: PreviewDatabase,
  routeId: string,
  partId: string,
  partName: string,
  areas: AreaId[],
): Phase[] {
  return areas.map((areaId, index) => {
    const responsible = db.users.find((user) => user.areaId === areaId && user.active)?.id;
    const type: PhaseType = areaId === 'quality' ? 'QUALITY' : areaId === 'workshop' ? 'INSPECTION' : 'WORK';
    return {
      id: makeId('phase'),
      routeSheetId: routeId,
      partId,
      areaId,
      order: (index + 1) * 10,
      name:
        type === 'QUALITY'
          ? 'Liberación de calidad'
          : type === 'INSPECTION'
            ? 'Inspección y reporte'
            : `Ejecución de ${partName.toLowerCase()}`,
      description:
        type === 'QUALITY'
          ? 'Verificar dimensiones, acabado y evidencias antes de liberar la parte.'
          : type === 'INSPECTION'
            ? 'Registrar hallazgos, mediciones y evidencias del área.'
            : 'Ejecutar la actividad según el plan de la hoja de ruta y registrar el avance.',
      type,
      status: index === 0 ? 'PENDING' : 'BLOCKED',
      responsibleId: responsible,
    };
  });
}

function refreshPartStatus(db: PreviewDatabase, partId: string): PreviewDatabase {
  const phases = db.phases.filter((phase) => phase.partId === partId);
  if (phases.length === 0) return db;
  const completed = phases.every((phase) => phase.status === 'COMPLETED');
  const started = phases.some((phase) => phase.status === 'COMPLETED' || phase.status === 'IN_PROGRESS');
  const currentArea =
    phases.find((phase) => phase.status === 'IN_PROGRESS')?.areaId ??
    phases.find((phase) => phase.status === 'PENDING')?.areaId ??
    phases[phases.length - 1]?.areaId ??
    'workshop';
  return {
    ...db,
    parts: db.parts.map((part) =>
      part.id === partId
        ? {
            ...part,
            status: completed ? 'COMPLETED' : started ? 'IN_PROGRESS' : 'PENDING',
            areaId: currentArea,
          }
        : part,
    ),
  };
}

function unblockNextPhase(db: PreviewDatabase, partId: string): PreviewDatabase {
  const phases = db.phases
    .filter((phase) => phase.partId === partId)
    .sort((a, b) => a.order - b.order);
  let previousCompleted = true;
  const updated = phases.map((phase) => {
    if (!previousCompleted) return phase;
    if (phase.status === 'BLOCKED') {
      const next = { ...phase, status: 'PENDING' as const };
      previousCompleted = false;
      return next;
    }
    previousCompleted = phase.status === 'COMPLETED';
    return phase;
  });
  return {
    ...db,
    phases: db.phases.map((phase) => updated.find((item) => item.id === phase.id) ?? phase),
  };
}

function maybeMoveToQuality(db: PreviewDatabase, routeId: string): PreviewDatabase {
  const phases = db.phases.filter((phase) => phase.routeSheetId === routeId);
  if (phases.length === 0) return db;
  if (!phases.every((phase) => phase.status === 'COMPLETED')) return db;
  return {
    ...db,
    routeSheets: db.routeSheets.map((route) =>
      route.id === routeId && route.status === 'IN_PROGRESS'
        ? { ...route, status: 'IN_QUALITY' as RouteStatus, updatedAt: new Date().toISOString() }
        : route,
    ),
  };
}

function nextServiceOrderCode(db: PreviewDatabase): string {
  const year = new Date().getFullYear();
  const prefix = `EXP-${year}-`;
  const highest = db.serviceOrders
    .map((order) => order.code)
    .filter((code) => code.startsWith(prefix))
    .map((code) => Number(code.replace(prefix, '')))
    .filter((value) => Number.isFinite(value))
    .reduce((max, value) => Math.max(max, value), 0);
  return `${prefix}${String(highest + 1).padStart(3, '0')}`;
}

function createRouteSheetForServiceOrder(
  db: PreviewDatabase,
  serviceOrderId: string,
  templateId: string,
  actorId: string,
): { db: PreviewDatabase; routeSheetId: string } | null {
  const order = db.serviceOrders.find((item) => item.id === serviceOrderId);
  const template = db.serviceTemplates.find((item) => item.id === templateId);
  if (!order || !template) return null;

  const asset = db.assets.find((item) => item.id === order.assetId);
  const client = db.clients.find((item) => item.id === order.clientId);
  const componentId = `comp-${asset?.id ?? serviceOrderId}`;
  const component =
    db.components.find((item) => item.id === componentId) ??
    ({
      id: componentId,
      name: asset ? `${asset.manufacturer} ${asset.model}` : `Servicio ${order.code}`,
      serial: asset?.serial ?? order.code,
      type: asset?.type ?? 'Servicio',
    } as const);

  const routeId = makeId('route');
  const partId = makeId('part');
  const routeCode = nextRouteCode(db);
  const now = new Date().toISOString();
  const phases: Phase[] = template.items.map((item, index) => ({
    id: makeId('phase'),
    routeSheetId: routeId,
    partId,
    areaId: item.areaId,
    order: (index + 1) * 10,
    name: item.name,
    description: item.requiresDocument
      ? `${item.name}. Documento requerido: ${item.requiresDocument}.`
      : item.name,
    type: item.type,
    status: index === 0 ? 'PENDING' : 'BLOCKED',
    responsibleId: db.users.find((user) => user.areaId === item.areaId && user.active)?.id,
  }));

  const routeSheet = {
    id: routeId,
    code: routeCode,
    componentId,
    clientId: order.clientId,
    serviceOrderId,
    templateId,
    description: `${order.description} · ${client?.name ?? 'Cliente'}`,
    status: 'DRAFT' as RouteStatus,
    priority: order.priority,
    createdAt: now,
    updatedAt: now,
    dueDate: order.dueDate,
    createdBy: actorId,
  };

  const part = {
    id: partId,
    routeSheetId: routeId,
    name: asset ? `${asset.model} · ${template.name}` : template.name,
    quantity: 1,
    status: 'PENDING' as const,
    areaId: template.items[0]?.areaId ?? 'workshop',
  };

  let nextDb: PreviewDatabase = {
    ...db,
    components: db.components.some((item) => item.id === componentId)
      ? db.components
      : [...db.components, component],
    routeSheets: [routeSheet, ...db.routeSheets],
    parts: [...db.parts, part],
    phases: [...db.phases, ...phases],
    serviceOrders: db.serviceOrders.map((item) =>
      item.id === serviceOrderId ? { ...item, routeSheetId: routeId } : item,
    ),
  };

  nextDb = pushAudit(
    nextDb,
    actorId,
    'CREATE',
    'Hoja de ruta',
    routeCode,
    `Hoja de ruta creada desde plantilla "${template.name}" para ${order.code}.`,
  );

  return { db: nextDb, routeSheetId: routeId };
}

interface PreviewActions {
  resetPreview: () => void;
  logLogin: (actorId: string) => void;
  createRouteSheet: (input: NewRouteSheetInput, actorId: string) => string;
  updateRouteSheet: (id: string, input: NewRouteSheetInput, actorId: string) => void;
  deleteRouteSheet: (id: string, actorId: string) => void;
  sendToReview: (id: string, actorId: string) => void;
  approveRouteSheet: (id: string, actorId: string) => void;
  rejectRouteSheet: (id: string, actorId: string, reason: string) => void;
  startRouteSheet: (id: string, actorId: string) => void;
  sendToQuality: (id: string, actorId: string) => void;
  approveQuality: (id: string, actorId: string, observations?: string) => void;
  rejectQuality: (id: string, actorId: string, observations: string) => void;
  deliverRouteSheet: (id: string, actorId: string) => void;
  addPart: (routeId: string, input: NewPartInput, actorId: string) => void;
  deletePart: (routeId: string, partId: string, actorId: string) => void;
  addInspectionPhase: (
    routeId: string,
    partId: string,
    areaId: AreaId,
    actorId: string,
    description: string,
  ) => void;
  completePhase: (
    phaseId: string,
    actorId: string,
    payload: { observations?: string; evidence?: string },
  ) => void;
  addSparePart: (routeId: string, input: NewSparePartInput, actorId: string) => void;
  updateSparePartStatus: (sparePartId: string, status: SparePartStatus, actorId: string) => void;
  addInventoryItem: (input: NewInventoryItemInput, actorId: string) => void;
  deleteInventoryItem: (itemId: string, actorId: string) => void;
  createLoan: (input: NewLoanInput, actorId: string) => void;
  returnLoan: (loanId: string, actorId: string) => void;
  createUser: (input: NewUserInput, actorId: string) => void;
  deleteUser: (userId: string, actorId: string) => void;
  createClient: (input: NewClientInput, actorId: string) => void;
  createServiceOrder: (input: NewServiceOrderInput, actorId: string) => string;
  updateServiceOrderStatus: (id: string, status: ServiceOrderStatus, actorId: string) => void;
  createRouteSheetFromTemplate: (serviceOrderId: string, templateId: string, actorId: string) => string | null;
  updateFieldJobStatus: (id: string, status: FieldJobStatus, actorId: string) => void;
  updateFieldJobReport: (id: string, report: string, actorId: string) => void;
  updateProjectPhase: (id: string, phase: ProjectPhase, progress: number, actorId: string) => void;
  updateSupplyStatus: (id: string, status: SupplyStatus, actorId: string) => void;
  createQualityRecord: (input: NewQualityRecordInput, actorId: string) => void;
  updateQualityRecordResult: (id: string, result: QualityResult, actorId: string) => void;
  createNonConformity: (input: NewNonConformityInput, actorId: string) => void;
  updateNonConformityStatus: (id: string, status: NonConformityStatus, actorId: string) => void;
  calibrateInventoryItem: (id: string, dueDate: string, certificate: string, actorId: string) => void;
}

interface PreviewStore extends PreviewActions {
  db: PreviewDatabase;
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
          db: pushAudit(
            state.db,
            actorId,
            'LOGIN',
            'Sesión',
            'preview',
            'Ingreso al modo preview.',
          ),
        }));
      },

      createRouteSheet: (input, actorId) => {
        const id = makeId('route');
        set((state) => {
          const route = {
            id,
            code: nextRouteCode(state.db),
            componentId: input.componentId,
            clientId: input.clientId,
            description: input.description,
            status: 'DRAFT' as RouteStatus,
            priority: input.priority,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            dueDate: new Date(input.dueDate).toISOString(),
            createdBy: actorId,
          };
          const component = state.db.components.find((item) => item.id === input.componentId);
          const db = pushAudit(
            { ...state.db, routeSheets: [route, ...state.db.routeSheets] },
            actorId,
            'CREATE',
            'Hoja de ruta',
            route.code,
            `Hoja de ruta creada para ${component?.name ?? 'componente'}.`,
          );
          return { db };
        });
        return id;
      },

      updateRouteSheet: (id, input, actorId) => {
        set((state) => {
          const route = state.db.routeSheets.find((item) => item.id === id);
          if (!route) return state;
          const updated = {
            ...route,
            componentId: input.componentId,
            clientId: input.clientId,
            description: input.description,
            priority: input.priority,
            dueDate: new Date(input.dueDate).toISOString(),
            updatedAt: new Date().toISOString(),
          };
          const db = {
            ...state.db,
            routeSheets: state.db.routeSheets.map((item) => (item.id === id ? updated : item)),
          };
          return {
            db: pushAudit(db, actorId, 'UPDATE', 'Hoja de ruta', route.code, 'Datos generales actualizados.'),
          };
        });
      },

      deleteRouteSheet: (id, actorId) => {
        set((state) => {
          const route = state.db.routeSheets.find((item) => item.id === id);
          if (!route) return state;
          const db: PreviewDatabase = {
            ...state.db,
            routeSheets: state.db.routeSheets.filter((item) => item.id !== id),
            parts: state.db.parts.filter((item) => item.routeSheetId !== id),
            phases: state.db.phases.filter((item) => item.routeSheetId !== id),
            spareParts: state.db.spareParts.filter((item) => item.routeSheetId !== id),
          };
          return {
            db: pushAudit(db, actorId, 'DELETE', 'Hoja de ruta', route.code, 'Hoja de ruta eliminada.'),
          };
        });
      },

      sendToReview: (id, actorId) => {
        set((state) => {
          const route = state.db.routeSheets.find((item) => item.id === id);
          if (!route || route.status !== 'DRAFT') return state;
          const routeParts = state.db.parts.filter((part) => part.routeSheetId === id);
          if (routeParts.length === 0) return state;
          const db: PreviewDatabase = {
            ...state.db,
            routeSheets: state.db.routeSheets.map((item) =>
              item.id === id ? { ...item, status: 'IN_REVIEW', updatedAt: new Date().toISOString() } : item,
            ),
          };
          return {
            db: pushAudit(db, actorId, 'UPDATE', 'Hoja de ruta', route.code, 'Enviada a revisión de Ingeniería.'),
          };
        });
      },

      approveRouteSheet: (id, actorId) => {
        set((state) => {
          const route = state.db.routeSheets.find((item) => item.id === id);
          if (!route) return state;
          const db: PreviewDatabase = {
            ...state.db,
            routeSheets: state.db.routeSheets.map((item) =>
              item.id === id
                ? {
                    ...item,
                    status: 'APPROVED',
                    approvedBy: actorId,
                    approvedAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  }
                : item,
            ),
          };
          return {
            db: pushAudit(db, actorId, 'APPROVE', 'Hoja de ruta', route.code, 'Hoja de ruta aprobada.'),
          };
        });
      },

      rejectRouteSheet: (id, actorId, reason) => {
        set((state) => {
          const route = state.db.routeSheets.find((item) => item.id === id);
          if (!route) return state;
          const db: PreviewDatabase = {
            ...state.db,
            routeSheets: state.db.routeSheets.map((item) =>
              item.id === id
                ? { ...item, status: 'DRAFT', observations: reason, updatedAt: new Date().toISOString() }
                : item,
            ),
          };
          return {
            db: pushAudit(db, actorId, 'REJECT', 'Hoja de ruta', route.code, `Devuelta a borrador: ${reason}`),
          };
        });
      },

      startRouteSheet: (id, actorId) => {
        set((state) => {
          const route = state.db.routeSheets.find((item) => item.id === id);
          if (!route) return state;
          const db: PreviewDatabase = {
            ...state.db,
            routeSheets: state.db.routeSheets.map((item) =>
              item.id === id ? { ...item, status: 'IN_PROGRESS', updatedAt: new Date().toISOString() } : item,
            ),
          };
          return {
            db: pushAudit(db, actorId, 'UPDATE', 'Hoja de ruta', route.code, 'Ejecución iniciada.'),
          };
        });
      },

      sendToQuality: (id, actorId) => {
        set((state) => {
          const route = state.db.routeSheets.find((item) => item.id === id);
          if (!route) return state;
          const db: PreviewDatabase = {
            ...state.db,
            routeSheets: state.db.routeSheets.map((item) =>
              item.id === id ? { ...item, status: 'IN_QUALITY', updatedAt: new Date().toISOString() } : item,
            ),
          };
          return {
            db: pushAudit(db, actorId, 'UPDATE', 'Hoja de ruta', route.code, 'Expediente enviado a Calidad.'),
          };
        });
      },

      approveQuality: (id, actorId, observations) => {
        set((state) => {
          const route = state.db.routeSheets.find((item) => item.id === id);
          if (!route) return state;
          const db: PreviewDatabase = {
            ...state.db,
            routeSheets: state.db.routeSheets.map((item) =>
              item.id === id
                ? {
                    ...item,
                    status: 'READY_FOR_DELIVERY',
                    observations: observations ?? item.observations,
                    updatedAt: new Date().toISOString(),
                  }
                : item,
            ),
          };
          return {
            db: pushAudit(db, actorId, 'APPROVE', 'Calidad', route.code, 'Visto bueno de calidad aprobado.'),
          };
        });
      },

      rejectQuality: (id, actorId, observations) => {
        set((state) => {
          const route = state.db.routeSheets.find((item) => item.id === id);
          if (!route) return state;
          const db: PreviewDatabase = {
            ...state.db,
            routeSheets: state.db.routeSheets.map((item) =>
              item.id === id
                ? {
                    ...item,
                    status: 'IN_PROGRESS',
                    observations: `Rechazado por calidad: ${observations}`,
                    updatedAt: new Date().toISOString(),
                  }
                : item,
            ),
          };
          return {
            db: pushAudit(db, actorId, 'REJECT', 'Calidad', route.code, observations),
          };
        });
      },

      deliverRouteSheet: (id, actorId) => {
        set((state) => {
          const route = state.db.routeSheets.find((item) => item.id === id);
          if (!route) return state;
          const db: PreviewDatabase = {
            ...state.db,
            routeSheets: state.db.routeSheets.map((item) =>
              item.id === id
                ? { ...item, status: 'DELIVERED', deliveredAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
                : item,
            ),
          };
          return {
            db: pushAudit(db, actorId, 'DELIVER', 'Hoja de ruta', route.code, 'Entrega confirmada con el cliente.'),
          };
        });
      },

      addPart: (routeId, input, actorId) => {
        set((state) => {
          const route = state.db.routeSheets.find((item) => item.id === routeId);
          if (!route) return state;
          const partId = makeId('part');
          const part: Part = {
            id: partId,
            routeSheetId: routeId,
            name: input.name,
            quantity: input.quantity,
            status: 'PENDING',
            areaId: input.areas[0] ?? 'workshop',
          };
          const phases = buildPhasesForPart(state.db, routeId, partId, input.name, input.areas);
          const db: PreviewDatabase = {
            ...state.db,
            parts: [...state.db.parts, part],
            phases: [...state.db.phases, ...phases],
          };
          return {
            db: pushAudit(
              db,
              actorId,
              'CREATE',
              'Parte',
              partId,
              `Parte "${input.name}" agregada a ${route.code}.`,
            ),
          };
        });
      },

      deletePart: (routeId, partId, actorId) => {
        set((state) => {
          const route = state.db.routeSheets.find((item) => item.id === routeId);
          const part = state.db.parts.find((item) => item.id === partId);
          if (!route || !part) return state;
          const db: PreviewDatabase = {
            ...state.db,
            parts: state.db.parts.filter((item) => item.id !== partId),
            phases: state.db.phases.filter((item) => item.partId !== partId),
          };
          return {
            db: pushAudit(db, actorId, 'DELETE', 'Parte', partId, `Parte "${part.name}" eliminada.`),
          };
        });
      },

      addInspectionPhase: (routeId, partId, areaId, actorId, description) => {
        set((state) => {
          const route = state.db.routeSheets.find((item) => item.id === routeId);
          const part = state.db.parts.find((item) => item.id === partId);
          if (!route || !part) return state;
          const partPhases = state.db.phases.filter((phase) => phase.partId === partId);
          const order = partPhases.length > 0 ? Math.max(...partPhases.map((phase) => phase.order)) + 10 : 10;
          const allPreviousCompleted = partPhases.every((phase) => phase.status === 'COMPLETED');
          const phase: Phase = {
            id: makeId('phase'),
            routeSheetId: routeId,
            partId,
            areaId,
            order,
            name: 'Inspección adicional',
            description,
            type: 'INSPECTION',
            status: allPreviousCompleted ? 'PENDING' : 'BLOCKED',
            responsibleId: state.db.users.find((user) => user.areaId === areaId && user.active)?.id,
          };
          const db: PreviewDatabase = {
            ...state.db,
            phases: [...state.db.phases, phase],
          };
          return {
            db: pushAudit(db, actorId, 'CREATE', 'Fase', phase.id, `Inspección agregada a ${route.code}.`),
          };
        });
      },

      completePhase: (phaseId, actorId, payload) => {
        set((state) => {
          const phase = state.db.phases.find((item) => item.id === phaseId);
          if (!phase || phase.status === 'COMPLETED') return state;
          const previousCompleted = state.db.phases
            .filter((item) => item.partId === phase.partId && item.order < phase.order)
            .every((item) => item.status === 'COMPLETED');
          if (!previousCompleted) return state;
          const route = state.db.routeSheets.find((item) => item.id === phase.routeSheetId);
          let db: PreviewDatabase = {
            ...state.db,
            phases: state.db.phases.map((item) =>
              item.id === phaseId
                ? {
                    ...item,
                    status: 'COMPLETED',
                    completedAt: new Date().toISOString(),
                    observations: payload.observations ?? item.observations,
                    evidence: payload.evidence ?? item.evidence,
                  }
                : item,
            ),
          };
          db = unblockNextPhase(db, phase.partId);
          db = refreshPartStatus(db, phase.partId);
          db = maybeMoveToQuality(db, phase.routeSheetId);
          if (route?.status === 'APPROVED') {
            db = {
              ...db,
              routeSheets: db.routeSheets.map((item) =>
                item.id === route.id ? { ...item, status: 'IN_PROGRESS', updatedAt: new Date().toISOString() } : item,
              ),
            };
            db = maybeMoveToQuality(db, route.id);
          }
          return {
            db: pushAudit(
              db,
              actorId,
              'COMPLETE',
              'Fase',
              phaseId,
              `Fase "${phase.name}" completada.`,
            ),
          };
        });
      },

      addSparePart: (routeId, input, actorId) => {
        set((state) => {
          const route = state.db.routeSheets.find((item) => item.id === routeId);
          if (!route) return state;
          const sparePart = {
            id: makeId('spare'),
            routeSheetId: routeId,
            partId: input.partId,
            name: input.name,
            code: input.code,
            quantity: input.quantity,
            areaId: input.areaId,
            status: 'PENDING' as SparePartStatus,
            requestedBy: actorId,
            requestedAt: new Date().toISOString(),
          };
          const db: PreviewDatabase = {
            ...state.db,
            spareParts: [sparePart, ...state.db.spareParts],
          };
          return {
            db: pushAudit(
              db,
              actorId,
              'CREATE',
              'Repuesto',
              sparePart.id,
              `Repuesto "${input.name}" solicitado para ${route.code}.`,
            ),
          };
        });
      },

      updateSparePartStatus: (sparePartId, status, actorId) => {
        set((state) => {
          const sparePart = state.db.spareParts.find((item) => item.id === sparePartId);
          if (!sparePart) return state;
          const db: PreviewDatabase = {
            ...state.db,
            spareParts: state.db.spareParts.map((item) =>
              item.id === sparePartId
                ? {
                    ...item,
                    status,
                    dispatchedAt: status === 'DISPATCHED' ? new Date().toISOString() : item.dispatchedAt,
                  }
                : item,
            ),
          };
          return {
            db: pushAudit(
              db,
              actorId,
              'DISPATCH',
              'Repuesto',
              sparePartId,
              `Repuesto "${sparePart.name}" actualizado a ${status.toLowerCase()}.`,
            ),
          };
        });
      },

      addInventoryItem: (input, actorId) => {
        set((state) => {
          const item = {
            id: makeId('inv'),
            ...input,
            status: (input.quantity > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK') as InventoryStatus,
          };
          const db: PreviewDatabase = {
            ...state.db,
            inventory: [item, ...state.db.inventory],
          };
          return {
            db: pushAudit(db, actorId, 'CREATE', 'Inventario', item.id, `Producto "${input.name}" registrado.`),
          };
        });
      },

      deleteInventoryItem: (itemId, actorId) => {
        set((state) => {
          const item = state.db.inventory.find((entry) => entry.id === itemId);
          if (!item) return state;
          const db: PreviewDatabase = {
            ...state.db,
            inventory: state.db.inventory.filter((entry) => entry.id !== itemId),
          };
          return {
            db: pushAudit(db, actorId, 'DELETE', 'Inventario', itemId, `Producto "${item.name}" eliminado.`),
          };
        });
      },

      createLoan: (input, actorId) => {
        set((state) => {
          const item = state.db.inventory.find((entry) => entry.id === input.itemId);
          if (!item) return state;
          const loan = {
            id: makeId('loan'),
            itemId: input.itemId,
            receivedBy: input.receivedBy,
            authorizedBy: actorId,
            loanedAt: new Date().toISOString(),
            status: 'ACTIVE' as const,
          };
          const db: PreviewDatabase = {
            ...state.db,
            loans: [loan, ...state.db.loans],
            inventory: state.db.inventory.map((entry) =>
              entry.id === input.itemId ? { ...entry, status: 'LOANED' as InventoryStatus } : entry,
            ),
          };
          return {
            db: pushAudit(db, actorId, 'CREATE', 'Préstamo', loan.id, `Préstamo de "${item.name}" a ${input.receivedBy}.`),
          };
        });
      },

      returnLoan: (loanId, actorId) => {
        set((state) => {
          const loan = state.db.loans.find((entry) => entry.id === loanId);
          if (!loan) return state;
          const item = state.db.inventory.find((entry) => entry.id === loan.itemId);
          const db: PreviewDatabase = {
            ...state.db,
            loans: state.db.loans.map((entry) =>
              entry.id === loanId
                ? { ...entry, status: 'RETURNED', returnedAt: new Date().toISOString() }
                : entry,
            ),
            inventory: state.db.inventory.map((entry) =>
              entry.id === loan.itemId ? { ...entry, status: 'AVAILABLE' as InventoryStatus } : entry,
            ),
          };
          return {
            db: pushAudit(db, actorId, 'UPDATE', 'Préstamo', loanId, `Devolución de "${item?.name ?? 'producto'}".`),
          };
        });
      },

      createUser: (input, actorId) => {
        set((state) => {
          if (state.db.users.some((user) => user.username.toLowerCase() === input.username.toLowerCase())) {
            return state;
          }
          const user = {
            id: makeId('user'),
            ...input,
            username: input.username.toLowerCase(),
            email: input.email.toLowerCase(),
            active: true,
            createdAt: new Date().toISOString(),
          };
          const db: PreviewDatabase = {
            ...state.db,
            users: [...state.db.users, user],
          };
          return {
            db: pushAudit(db, actorId, 'CREATE', 'Usuario', user.id, `Usuario "${input.name}" creado.`),
          };
        });
      },

      deleteUser: (userId, actorId) => {
        set((state) => {
          const user = state.db.users.find((entry) => entry.id === userId);
          if (!user) return state;
          const db: PreviewDatabase = {
            ...state.db,
            users: state.db.users.filter((entry) => entry.id !== userId),
          };
          return {
            db: pushAudit(db, actorId, 'DELETE', 'Usuario', userId, `Usuario "${user.name}" eliminado.`),
          };
        });
      },

      createClient: (input, actorId) => {
        set((state) => {
          const client = { id: makeId('cli'), ...input };
          const db: PreviewDatabase = {
            ...state.db,
            clients: [...state.db.clients, client],
          };
          return {
            db: pushAudit(db, actorId, 'CREATE', 'Cliente', client.id, `Cliente "${input.name}" registrado.`),
          };
        });
      },

      createServiceOrder: (input, actorId) => {
        const id = makeId('so');
        set((state) => {
          const order = {
            id,
            code: nextServiceOrderCode(state.db),
            mode: input.mode,
            status: 'RECEIVED' as ServiceOrderStatus,
            clientId: input.clientId,
            assetId: input.assetId,
            site: input.site,
            scope: input.scope,
            description: input.description,
            priority: input.priority,
            createdAt: new Date().toISOString(),
            dueDate: new Date(input.dueDate).toISOString(),
            createdBy: actorId,
          };
          let db: PreviewDatabase = {
            ...state.db,
            serviceOrders: [order, ...state.db.serviceOrders],
          };

          if (input.mode === 'FIELD') {
            db = {
              ...db,
              fieldJobs: [
                {
                  id: makeId('field'),
                  serviceOrderId: id,
                  siteName: input.fieldSite?.siteName ?? input.site,
                  location: input.fieldSite?.location ?? input.site,
                  permits: input.fieldSite?.permits ?? 'Pendiente',
                  riskAnalysis: input.fieldSite?.riskAnalysis ?? 'Pendiente',
                  crew: input.fieldSite?.crew ? input.fieldSite.crew.split(',').map((item) => item.trim()).filter(Boolean) : [],
                  containers: input.fieldSite?.containers ?? 1,
                  cranes: input.fieldSite?.cranes ?? 'Por definir',
                  status: 'PLANNED' as FieldJobStatus,
                },
                ...db.fieldJobs,
              ],
            };
          }

          if (input.mode === 'PROJECT') {
            db = {
              ...db,
              projects: [
                {
                  id: makeId('project'),
                  serviceOrderId: id,
                  name: input.projectName ?? input.description,
                  phase: 'ENGINEERING' as ProjectPhase,
                  progress: 0,
                  milestones: [
                    { id: makeId('pm'), name: 'Ingeniería', phase: 'ENGINEERING' as ProjectPhase, status: 'IN_PROGRESS' as const },
                    { id: makeId('pm'), name: 'Procura', phase: 'PROCUREMENT' as ProjectPhase, status: 'PENDING' as const },
                    { id: makeId('pm'), name: 'Construcción', phase: 'CONSTRUCTION' as ProjectPhase, status: 'PENDING' as const },
                    { id: makeId('pm'), name: 'Comisionamiento', phase: 'COMMISSIONING' as ProjectPhase, status: 'PENDING' as const },
                  ],
                },
                ...db.projects,
              ],
            };
          }

          if (input.mode === 'SUPPLY') {
            db = {
              ...db,
              supplyOrders: [
                {
                  id: makeId('supply'),
                  serviceOrderId: id,
                  status: 'REQUESTED' as SupplyStatus,
                  items: (input.supplyItems ?? []).map((item) => ({
                    id: makeId('si'),
                    name: item.name,
                    code: item.code,
                    quantity: item.quantity,
                    status: 'REQUESTED' as SupplyStatus,
                  })),
                },
                ...db.supplyOrders,
              ],
            };
          }

          db = pushAudit(db, actorId, 'CREATE', 'Expediente', order.code, `Expediente ${order.code} creado en modo ${input.mode}.`);
          if (input.templateId) {
            const result = createRouteSheetForServiceOrder(db, id, input.templateId, actorId);
            if (result) db = result.db;
          }
          return { db };
        });
        return id;
      },

      updateServiceOrderStatus: (id, status, actorId) => {
        set((state) => {
          const order = state.db.serviceOrders.find((item) => item.id === id);
          if (!order) return state;
          const routeStatusMap: Partial<Record<ServiceOrderStatus, RouteStatus>> = {
            RECEIVED: 'DRAFT',
            DIAGNOSIS: 'DRAFT',
            SCOPING: 'DRAFT',
            PLANNING: 'DRAFT',
            APPROVED: 'APPROVED',
            IN_EXECUTION: 'IN_PROGRESS',
            IN_QUALITY: 'IN_QUALITY',
            READY_FOR_DELIVERY: 'READY_FOR_DELIVERY',
            DELIVERED: 'DELIVERED',
            CLOSED: 'DELIVERED',
          };
          const routeStatus = routeStatusMap[status];
          const db: PreviewDatabase = {
            ...state.db,
            serviceOrders: state.db.serviceOrders.map((item) =>
              item.id === id
                ? {
                    ...item,
                    status,
                    approvedBy: status === 'APPROVED' ? actorId : item.approvedBy,
                    approvedAt: status === 'APPROVED' ? new Date().toISOString() : item.approvedAt,
                  }
                : item,
            ),
            routeSheets: order.routeSheetId && routeStatus
              ? state.db.routeSheets.map((route) =>
                  route.id === order.routeSheetId
                    ? {
                        ...route,
                        status: routeStatus,
                        approvedBy: routeStatus === 'APPROVED' ? actorId : route.approvedBy,
                        approvedAt: routeStatus === 'APPROVED' ? new Date().toISOString() : route.approvedAt,
                        deliveredAt: routeStatus === 'DELIVERED' ? new Date().toISOString() : route.deliveredAt,
                        updatedAt: new Date().toISOString(),
                      }
                    : route,
                )
              : state.db.routeSheets,
          };
          return {
            db: pushAudit(db, actorId, 'UPDATE', 'Expediente', order.code, `Estado actualizado a ${status}.`),
          };
        });
      },

      createRouteSheetFromTemplate: (serviceOrderId, templateId, actorId) => {
        let routeSheetId: string | null = null;
        set((state) => {
          const result = createRouteSheetForServiceOrder(state.db, serviceOrderId, templateId, actorId);
          if (!result) return state;
          routeSheetId = result.routeSheetId;
          return { db: result.db };
        });
        return routeSheetId;
      },

      updateFieldJobStatus: (id, status, actorId) => {
        set((state) => {
          const job = state.db.fieldJobs.find((item) => item.id === id);
          if (!job) return state;
          const db: PreviewDatabase = {
            ...state.db,
            fieldJobs: state.db.fieldJobs.map((item) =>
              item.id === id
                ? {
                    ...item,
                    status,
                    mobilizationDate: status === 'MOBILIZED' ? new Date().toISOString() : item.mobilizationDate,
                    demobilizationDate: status === 'DEMOBILIZED' ? new Date().toISOString() : item.demobilizationDate,
                  }
                : item,
            ),
          };
          return {
            db: pushAudit(db, actorId, 'UPDATE', 'Campo', job.id, `Movilización actualizada a ${status}.`),
          };
        });
      },

      updateFieldJobReport: (id, report, actorId) => {
        set((state) => {
          const job = state.db.fieldJobs.find((item) => item.id === id);
          if (!job) return state;
          const db: PreviewDatabase = {
            ...state.db,
            fieldJobs: state.db.fieldJobs.map((item) => (item.id === id ? { ...item, report } : item)),
          };
          return {
            db: pushAudit(db, actorId, 'UPDATE', 'Campo', job.id, 'Reporte de campo actualizado.'),
          };
        });
      },

      updateProjectPhase: (id, phase, progress, actorId) => {
        set((state) => {
          const project = state.db.projects.find((item) => item.id === id);
          if (!project) return state;
          const db: PreviewDatabase = {
            ...state.db,
            projects: state.db.projects.map((item) =>
              item.id === id ? { ...item, phase, progress } : item,
            ),
          };
          return {
            db: pushAudit(db, actorId, 'UPDATE', 'Proyecto', project.id, `Fase actualizada a ${phase} (${progress}%).`),
          };
        });
      },

      updateSupplyStatus: (id, status, actorId) => {
        set((state) => {
          const supply = state.db.supplyOrders.find((item) => item.id === id);
          if (!supply) return state;
          const db: PreviewDatabase = {
            ...state.db,
            supplyOrders: state.db.supplyOrders.map((item) =>
              item.id === id
                ? {
                    ...item,
                    status,
                    deliveredAt: status === 'DELIVERED' ? new Date().toISOString() : item.deliveredAt,
                  }
                : item,
            ),
          };
          return {
            db: pushAudit(db, actorId, 'UPDATE', 'Suministro', supply.id, `Estado actualizado a ${status}.`),
          };
        });
      },

      createQualityRecord: (input, actorId) => {
        set((state) => {
          const order = state.db.serviceOrders.find((item) => item.id === input.serviceOrderId);
          if (!order) return state;
          const record = {
            id: makeId('quality'),
            ...input,
            result: 'PENDING' as QualityResult,
          };
          const db: PreviewDatabase = {
            ...state.db,
            qualityRecords: [record, ...state.db.qualityRecords],
          };
          return {
            db: pushAudit(db, actorId, 'CREATE', 'Calidad', record.id, `Registro ${input.type} creado para ${order.code}.`),
          };
        });
      },

      updateQualityRecordResult: (id, result, actorId) => {
        set((state) => {
          const record = state.db.qualityRecords.find((item) => item.id === id);
          if (!record) return state;
          const db: PreviewDatabase = {
            ...state.db,
            qualityRecords: state.db.qualityRecords.map((item) =>
              item.id === id
                ? { ...item, result, testedAt: result === 'PENDING' ? item.testedAt : new Date().toISOString() }
                : item,
            ),
          };
          return {
            db: pushAudit(db, actorId, result === 'FAIL' ? 'REJECT' : 'APPROVE', 'Calidad', record.id, `Resultado ${result}.`),
          };
        });
      },

      createNonConformity: (input, actorId) => {
        set((state) => {
          const order = state.db.serviceOrders.find((item) => item.id === input.serviceOrderId);
          if (!order) return state;
          const record = {
            id: makeId('nc'),
            ...input,
            status: 'OPEN' as NonConformityStatus,
            createdAt: new Date().toISOString(),
          };
          const db: PreviewDatabase = {
            ...state.db,
            nonConformities: [record, ...state.db.nonConformities],
          };
          return {
            db: pushAudit(db, actorId, 'CREATE', 'No conformidad', record.id, `No conformidad registrada para ${order.code}.`),
          };
        });
      },

      updateNonConformityStatus: (id, status, actorId) => {
        set((state) => {
          const record = state.db.nonConformities.find((item) => item.id === id);
          if (!record) return state;
          const db: PreviewDatabase = {
            ...state.db,
            nonConformities: state.db.nonConformities.map((item) =>
              item.id === id
                ? { ...item, status, closedAt: status === 'CLOSED' ? new Date().toISOString() : item.closedAt }
                : item,
            ),
          };
          return {
            db: pushAudit(db, actorId, 'UPDATE', 'No conformidad', record.id, `Estado actualizado a ${status}.`),
          };
        });
      },

      calibrateInventoryItem: (id, dueDate, certificate, actorId) => {
        set((state) => {
          const item = state.db.inventory.find((entry) => entry.id === id);
          if (!item) return state;
          const db: PreviewDatabase = {
            ...state.db,
            inventory: state.db.inventory.map((entry) =>
              entry.id === id
                ? { ...entry, calibrationDue: dueDate, certificate }
                : entry,
            ),
          };
          return {
            db: pushAudit(db, actorId, 'UPDATE', 'Calibración', item.id, `Instrumento calibrado. Vence ${dueDate}.`),
          };
        });
      },
    }),
    {
      name: 'turbopre.preview.db',
      version: 2,
      migrate: () => ({ db: seedDatabase() }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as { db?: Partial<PreviewDatabase> } | undefined;
        const persistedDb = persisted?.db;
        const seed = seedDatabase();
        return {
          ...currentState,
          ...persisted,
          db: {
            ...seed,
            ...persistedDb,
            users: persistedDb?.users ?? seed.users,
            clients: persistedDb?.clients ?? seed.clients,
            components: persistedDb?.components ?? seed.components,
            assets: persistedDb?.assets ?? seed.assets,
            serviceOrders: persistedDb?.serviceOrders ?? seed.serviceOrders,
            serviceTemplates: persistedDb?.serviceTemplates ?? seed.serviceTemplates,
            fieldJobs: persistedDb?.fieldJobs ?? seed.fieldJobs,
            projects: persistedDb?.projects ?? seed.projects,
            supplyOrders: persistedDb?.supplyOrders ?? seed.supplyOrders,
            qualityRecords: persistedDb?.qualityRecords ?? seed.qualityRecords,
            nonConformities: persistedDb?.nonConformities ?? seed.nonConformities,
            routeSheets: persistedDb?.routeSheets ?? seed.routeSheets,
            parts: persistedDb?.parts ?? seed.parts,
            phases: persistedDb?.phases ?? seed.phases,
            spareParts: persistedDb?.spareParts ?? seed.spareParts,
            inventory: persistedDb?.inventory ?? seed.inventory,
            loans: persistedDb?.loans ?? seed.loans,
            audit: persistedDb?.audit ?? seed.audit,
          },
        };
      },
    },
  ),
);

export function resetPreviewData(): void {
  usePreviewStore.getState().resetPreview();
}
