import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { seedDatabase } from '../data/seed';
import type {
  AuditAction,
  AreaId,
  InventoryStatus,
  NewClientInput,
  NewInventoryItemInput,
  NewLoanInput,
  NewPartInput,
  NewRouteSheetInput,
  NewSparePartInput,
  NewUserInput,
  Part,
  Phase,
  PhaseType,
  PreviewDatabase,
  RouteStatus,
  SparePartStatus,
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
    }),
    {
      name: 'turbopre.preview.db',
      version: 1,
    },
  ),
);

export function resetPreviewData(): void {
  usePreviewStore.getState().resetPreview();
}
