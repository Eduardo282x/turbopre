/**
 * Modelo provisional del frontend CAMI (modo preview).
 *
 * La espina dorsal es:
 *   Orden de servicio (ODS) → Inspección → Hoja de ruta → Anexos → Calidad → Entrega
 *
 * No define el esquema definitivo de Prisma. Cuando se conecte el backend, estos
 * tipos se reemplazan por los contratos de packages/shared + services/<dominio>.
 */

export type RoleId =
  | 'GLOBAL'
  | 'SALES'
  | 'WORKSHOP'
  | 'ENGINEERING'
  | 'OPERATOR'
  | 'QUALITY'
  | 'PROJECT'
  | 'WAREHOUSE';

export type ProcessId =
  | 'rotating'
  | 'machining'
  | 'generators'
  | 'welding'
  | 'engineering'
  | 'quality';

export type PositionId =
  | 'rotating_specialist'
  | 'rotating_mechanic_1'
  | 'rotating_mechanic_2'
  | 'lifting_operator'
  | 'abrasive_operator'
  | 'winder_1'
  | 'winder_2'
  | 'welder_fi'
  | 'welder_1'
  | 'welder_2'
  | 'machine_operator_1'
  | 'machine_operator_2'
  | 'deburrer'
  | 'eng_plans'
  | 'eng_pmi'
  | 'eng_sample_cut'
  | 'eng_metallography'
  | 'quality_inspector';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TaskStatus = 'BLOCKED' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type TaskSource = 'INSPECTION' | 'ROUTE';

export type InspectionStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED' | 'REJECTED';

export type RouteStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'IN_ANNEXES'
  | 'IN_QUALITY'
  | 'READY_FOR_DELIVERY'
  | 'DELIVERED';

export type ServiceOrderStatus =
  | 'RECEIVED'
  | 'IN_INSPECTION'
  | 'INSPECTION_APPROVED'
  | 'IN_ROUTE'
  | 'IN_EXECUTION'
  | 'IN_ANNEXES'
  | 'IN_QUALITY'
  | 'READY_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export type SpareItemStatus = 'PENDING' | 'APPROVED' | 'DISPATCHED' | 'IN_PROCURE' | 'RECEIVED';
export type SpareDestination = 'WAREHOUSE' | 'PROCURE';

export type InventoryStatus = 'AVAILABLE' | 'LOANED' | 'OUT_OF_STOCK';
export type LoanStatus = 'ACTIVE' | 'RETURNED';

export type AssetType =
  | 'GAS_TURBINE'
  | 'STEAM_TURBINE'
  | 'GENERATOR'
  | 'COMPRESSOR'
  | 'AUXILIARY';

export type ProjectPhase =
  | 'ENGINEERING'
  | 'PROCUREMENT'
  | 'CONSTRUCTION'
  | 'COMMISSIONING'
  | 'CLOSED';

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'APPROVE'
  | 'REJECT'
  | 'COMPLETE'
  | 'DISPATCH'
  | 'DELIVER'
  | 'LOGIN'
  | 'RESET';

export interface Process {
  id: ProcessId;
  name: string;
  shortName: string;
  group: 'workshop' | 'engineering' | 'quality';
  color: string;
}

export interface Position {
  id: PositionId;
  name: string;
  shortName: string;
  processId: ProcessId;
  color: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  password: string;
  email: string;
  role: RoleId;
  positionId?: PositionId;
  active: boolean;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  code: string;
  contact: string;
  email: string;
  phone: string;
}

export interface Asset {
  id: string;
  clientId: string;
  type: AssetType;
  manufacturer: string;
  model: string;
  serial: string;
  tag: string;
  location: string;
  notes?: string;
}

export interface ServiceOrder {
  id: string;
  code: string;
  subCode: string;
  clientId: string;
  assetId: string;
  equipmentCode: string;
  description: string;
  scope: string;
  priority: Priority;
  dueDate: string;
  site: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  inspectionId?: string;
  routeSheetId?: string;
  observations?: string;
  cancelledAt?: string;
}

export interface Inspection {
  id: string;
  code: string;
  serviceOrderId: string;
  status: InspectionStatus;
  findings?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedReason?: string;
}

export interface RouteSheet {
  id: string;
  code: string;
  serviceOrderId: string;
  inspectionId: string;
  description: string;
  serial: string;
  equipmentCode: string;
  site: string;
  scope: string;
  priority: Priority;
  dueDate: string;
  status: RouteStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  preparedBy: string;
  preparedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedReason?: string;
  annexFinalizedBy?: string;
  annexFinalizedAt?: string;
  qualityApprovedBy?: string;
  qualityApprovedAt?: string;
  deliveredAt?: string;
  observations?: string;
  aiDraftUsed?: boolean;
}

export interface Task {
  id: string;
  inspectionId?: string;
  routeSheetId?: string;
  source: TaskSource;
  sourceTaskId?: string;
  step: number;
  stage: number;
  processId: ProcessId;
  positionId: PositionId;
  assignedUserId?: string;
  description: string;
  criteria?: string;
  forms?: string;
  status: TaskStatus;
  evidence?: string;
  observations?: string;
  startedAt?: string;
  completedAt?: string;
  completedBy?: string;
  annexSelected?: boolean;
}

export interface SpareItem {
  id: string;
  name: string;
  code: string;
  quantity: number;
  destination: SpareDestination;
  status: SpareItemStatus;
  available: boolean;
}

export interface SpareRequest {
  id: string;
  code: string;
  routeSheetId: string;
  requestedBy: string;
  requestedAt: string;
  items: SpareItem[];
  notes?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  code: string;
  category: string;
  quantity: number;
  status: InventoryStatus;
  location: string;
  qrCode?: string;
  laserMarked?: boolean;
  controlledAtmosphere?: boolean;
  certificate?: string;
  calibrationDue?: string;
}

export interface Loan {
  id: string;
  itemId: string;
  receivedBy: string;
  authorizedBy: string;
  loanedAt: string;
  returnedAt?: string;
  status: LoanStatus;
}

export interface ProjectMilestone {
  id: string;
  name: string;
  phase: ProjectPhase;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  date?: string;
}

export interface Project {
  id: string;
  name: string;
  clientId: string;
  ownerId: string;
  phase: ProjectPhase;
  progress: number;
  startDate: string;
  dueDate: string;
  milestones: ProjectMilestone[];
}

export interface AuditEntry {
  id: string;
  userId: string;
  userName: string;
  action: AuditAction;
  entity: string;
  entityId: string;
  detail: string;
  createdAt: string;
}

export interface PreviewDatabase {
  users: User[];
  clients: Client[];
  assets: Asset[];
  serviceOrders: ServiceOrder[];
  inspections: Inspection[];
  routeSheets: RouteSheet[];
  tasks: Task[];
  spareRequests: SpareRequest[];
  inventory: InventoryItem[];
  loans: Loan[];
  projects: Project[];
  audit: AuditEntry[];
}

export interface NewServiceOrderInput {
  code: string;
  subCode: string;
  clientId: string;
  assetId: string;
  equipmentCode: string;
  description: string;
  scope: string;
  priority: Priority;
  dueDate: string;
  site: string;
  observations?: string;
}

export interface NewTaskInput {
  stage: number;
  processId: ProcessId;
  positionId: PositionId;
  assignedUserId?: string;
  description: string;
  criteria?: string;
  forms?: string;
}

export interface NewInspectionInput {
  serviceOrderId: string;
  findings?: string;
  tasks: NewTaskInput[];
}

export interface NewRouteSheetInput {
  inspectionId: string;
  description: string;
  serial: string;
  equipmentCode: string;
  site: string;
  scope: string;
  priority: Priority;
  dueDate: string;
  observations?: string;
  tasks: NewTaskInput[];
  aiDraftUsed?: boolean;
}

export interface NewSpareItemInput {
  name: string;
  code: string;
  quantity: number;
}

export interface NewSpareRequestInput {
  items: NewSpareItemInput[];
  notes?: string;
}

export interface NewInventoryItemInput {
  name: string;
  code: string;
  category: string;
  quantity: number;
  location: string;
}

export interface NewLoanInput {
  itemId: string;
  receivedBy: string;
}

export interface NewClientInput {
  name: string;
  code: string;
  contact: string;
  email: string;
  phone: string;
}

export interface NewUserInput {
  name: string;
  username: string;
  password: string;
  email: string;
  role: RoleId;
  positionId?: PositionId;
}

export interface NewProjectInput {
  name: string;
  clientId: string;
  ownerId: string;
  phase: ProjectPhase;
  startDate: string;
  dueDate: string;
}

export interface ServiceOrderWithRelations extends ServiceOrder {
  client?: Client;
  asset?: Asset;
  creator: User;
  inspection?: InspectionWithRelations;
  routeSheet?: RouteSheetWithRelations;
  status: ServiceOrderStatus;
  progress: number;
}

export interface InspectionWithRelations extends Inspection {
  serviceOrder: ServiceOrder;
  client?: Client;
  asset?: Asset;
  creator: User;
  approver?: User;
  tasks: Task[];
  progress: number;
  completedTasks: number;
  totalTasks: number;
}

export interface RouteSheetWithRelations extends RouteSheet {
  serviceOrder: ServiceOrder;
  inspection: InspectionWithRelations;
  client?: Client;
  asset?: Asset;
  creator: User;
  approver?: User;
  tasks: Task[];
  spareRequests: SpareRequest[];
  progress: number;
  completedTasks: number;
  totalTasks: number;
  currentStage?: number;
  activeProcess?: Process;
}

export interface TaskWithContext {
  task: Task;
  process: Process;
  position: Position;
  inspection?: InspectionWithRelations;
  routeSheet?: RouteSheetWithRelations;
  serviceOrder?: ServiceOrderWithRelations;
  client?: Client;
  asset?: Asset;
  assignee?: User;
}
