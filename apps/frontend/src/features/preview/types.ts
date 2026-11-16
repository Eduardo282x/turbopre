export type RoleId =
  | 'GLOBAL'
  | 'PLANNING'
  | 'ENGINEERING'
  | 'SALES'
  | 'WORKSHOP'
  | 'OPERATOR'
  | 'WAREHOUSE'
  | 'QUALITY';

export type AreaId =
  | 'planning'
  | 'engineering'
  | 'turbines'
  | 'welding'
  | 'machining'
  | 'generators'
  | 'workshop'
  | 'warehouse'
  | 'quality'
  | 'sales';

export type RouteStatus =
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'IN_QUALITY'
  | 'READY_FOR_DELIVERY'
  | 'DELIVERED';

export type PhaseStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
export type PhaseType = 'WORK' | 'INSPECTION' | 'QUALITY';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type PartStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type SparePartStatus = 'PENDING' | 'APPROVED' | 'DISPATCHED';
export type InventoryStatus = 'AVAILABLE' | 'LOANED' | 'OUT_OF_STOCK';
export type LoanStatus = 'ACTIVE' | 'RETURNED';
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

export interface Area {
  id: AreaId;
  name: string;
  shortName: string;
  group: 'planning' | 'engineering' | 'production' | 'support' | 'commercial';
  order: number;
  color: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: RoleId;
  areaId?: AreaId;
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

export interface Component {
  id: string;
  name: string;
  serial: string;
  type: string;
}

export interface RouteSheet {
  id: string;
  code: string;
  componentId: string;
  clientId?: string;
  description: string;
  status: RouteStatus;
  priority: Priority;
  createdAt: string;
  updatedAt: string;
  dueDate: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  deliveredAt?: string;
  observations?: string;
}

export interface Part {
  id: string;
  routeSheetId: string;
  name: string;
  quantity: number;
  status: PartStatus;
  areaId: AreaId;
}

export interface Phase {
  id: string;
  routeSheetId: string;
  partId: string;
  areaId: AreaId;
  order: number;
  name: string;
  description: string;
  type: PhaseType;
  status: PhaseStatus;
  responsibleId?: string;
  startedAt?: string;
  completedAt?: string;
  observations?: string;
  evidence?: string;
}

export interface SparePart {
  id: string;
  routeSheetId: string;
  partId?: string;
  name: string;
  code: string;
  quantity: number;
  areaId: AreaId;
  status: SparePartStatus;
  requestedBy: string;
  requestedAt: string;
  dispatchedAt?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  code: string;
  category: string;
  quantity: number;
  status: InventoryStatus;
  location: string;
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
  components: Component[];
  routeSheets: RouteSheet[];
  parts: Part[];
  phases: Phase[];
  spareParts: SparePart[];
  inventory: InventoryItem[];
  loans: Loan[];
  audit: AuditEntry[];
}

export interface NewRouteSheetInput {
  componentId: string;
  clientId?: string;
  description: string;
  priority: Priority;
  dueDate: string;
}

export interface NewPartInput {
  name: string;
  quantity: number;
  areas: AreaId[];
}

export interface NewSparePartInput {
  name: string;
  code: string;
  quantity: number;
  areaId: AreaId;
  partId?: string;
}

export interface NewUserInput {
  name: string;
  username: string;
  email: string;
  role: RoleId;
  areaId?: AreaId;
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

export interface RouteSheetWithRelations extends RouteSheet {
  component: Component;
  client?: Client;
  creator: User;
  parts: Part[];
  phases: Phase[];
  spareParts: SparePart[];
  progress: number;
  completedPhases: number;
  totalPhases: number;
}
