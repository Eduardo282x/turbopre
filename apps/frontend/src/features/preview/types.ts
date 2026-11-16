export type RoleId =
  | 'GLOBAL'
  | 'PLANNING'
  | 'ENGINEERING'
  | 'SALES'
  | 'WORKSHOP'
  | 'OPERATOR'
  | 'WAREHOUSE'
  | 'QUALITY'
  | 'FIELD'
  | 'PROJECT'
  | 'NDT'
  | 'METROLOGY'
  | 'HSE'
  | 'PROCUREMENT'
  | 'SECTION_CHIEF';

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
  | 'sales'
  | 'assembly'
  | 'machining_major'
  | 'machining_minor'
  | 'balancing'
  | 'special_welding'
  | 'generator_shop'
  | 'thermal_coatings'
  | 'metrology'
  | 'material_warehouse'
  | 'admin'
  | 'field_gas'
  | 'field_steam'
  | 'field_generator'
  | 'field_engineering'
  | 'projects'
  | 'supply';

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

export type ServiceMode = 'SHOP' | 'FIELD' | 'PROJECT' | 'SUPPLY';

export type ServiceOrderStatus =
  | 'RECEIVED'
  | 'DIAGNOSIS'
  | 'SCOPING'
  | 'PLANNING'
  | 'APPROVED'
  | 'IN_EXECUTION'
  | 'IN_QUALITY'
  | 'READY_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CLOSED'
  | 'CANCELLED';

export type AssetType =
  | 'GAS_TURBINE'
  | 'STEAM_TURBINE'
  | 'GENERATOR'
  | 'COMPRESSOR'
  | 'CONTROL_SYSTEM'
  | 'AUXILIARY';

export type ServiceScope =
  | 'COMBUSTION_INSPECTION'
  | 'HOT_GAS_PATH'
  | 'MAJOR_OVERHAUL'
  | 'STEAM_ROTOR_REPAIR'
  | 'STEAM_DIAPHRAGM_REPAIR'
  | 'STEAM_CASING_REPAIR'
  | 'GENERATOR_STATOR'
  | 'GENERATOR_ROTOR_MINOR'
  | 'GENERATOR_ROTOR_MAJOR'
  | 'GENERATOR_REINSULATION'
  | 'GENERATOR_REWIND'
  | 'SHOP_MACHINING'
  | 'SHOP_BALANCING'
  | 'SHOP_WELDING'
  | 'SHOP_COATING'
  | 'SHOP_HEAT_TREATMENT'
  | 'SHOP_ASSEMBLY'
  | 'NDT'
  | 'CONDITION_MONITORING'
  | 'FIELD_PROJECT'
  | 'SUPPLY_COMPONENTS'
  | 'SUPPLY_CONTROL_SYSTEMS';

export type QualityRecordType =
  | 'NDT'
  | 'ELECTRICAL'
  | 'DIMENSIONAL'
  | 'BALANCE'
  | 'COATING'
  | 'HEAT_TREATMENT'
  | 'VISUAL'
  | 'FINAL';

export type QualityResult = 'PENDING' | 'PASS' | 'FAIL';
export type NonConformitySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type NonConformityStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
export type FieldJobStatus = 'PLANNED' | 'MOBILIZED' | 'IN_EXECUTION' | 'DEMOBILIZED' | 'CLOSED';
export type ProjectPhase =
  | 'ENGINEERING'
  | 'PROCUREMENT'
  | 'CONSTRUCTION'
  | 'PRECOMMISSIONING'
  | 'COMMISSIONING'
  | 'CLOSED';
export type SupplyStatus =
  | 'REQUESTED'
  | 'QUOTED'
  | 'PURCHASED'
  | 'INSPECTION'
  | 'DISPATCHED'
  | 'DELIVERED';

export interface Area {
  id: AreaId;
  name: string;
  shortName: string;
  group:
    | 'planning'
    | 'engineering'
    | 'production'
    | 'support'
    | 'commercial'
    | 'field'
    | 'projects'
    | 'supply'
    | 'admin';
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
  serviceOrderId?: string;
  templateId?: string;
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
  qrCode?: string;
  laserMarked?: boolean;
  controlledAtmosphere?: boolean;
  certificate?: string;
  calibrationDue?: string;
  reservedForServiceOrderId?: string;
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

export interface Asset {
  id: string;
  clientId: string;
  type: AssetType;
  manufacturer: string;
  model: string;
  serial: string;
  tag: string;
  ratedPower: string;
  technology: string;
  location: string;
  notes?: string;
}

export interface ServiceOrder {
  id: string;
  code: string;
  mode: ServiceMode;
  status: ServiceOrderStatus;
  clientId: string;
  assetId: string;
  site: string;
  scope: ServiceScope;
  description: string;
  priority: Priority;
  createdAt: string;
  dueDate: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  routeSheetId?: string;
  observations?: string;
}

export interface FieldJob {
  id: string;
  serviceOrderId: string;
  siteName: string;
  location: string;
  permits: string;
  riskAnalysis: string;
  crew: string[];
  mobilizationDate?: string;
  demobilizationDate?: string;
  containers: number;
  cranes: string;
  status: FieldJobStatus;
  report?: string;
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
  serviceOrderId: string;
  name: string;
  phase: ProjectPhase;
  progress: number;
  milestones: ProjectMilestone[];
}

export interface SupplyItem {
  id: string;
  name: string;
  code: string;
  quantity: number;
  status: SupplyStatus;
}

export interface SupplyOrder {
  id: string;
  serviceOrderId: string;
  items: SupplyItem[];
  status: SupplyStatus;
  supplier?: string;
  purchaseOrder?: string;
  expectedDate?: string;
  deliveredAt?: string;
}

export interface QualityRecord {
  id: string;
  serviceOrderId: string;
  routeSheetId?: string;
  phaseId?: string;
  type: QualityRecordType;
  method: string;
  standard: string;
  acceptanceCriteria: string;
  result: QualityResult;
  inspectorId?: string;
  certificate?: string;
  testedAt?: string;
  notes?: string;
}

export interface NonConformity {
  id: string;
  serviceOrderId: string;
  description: string;
  severity: NonConformitySeverity;
  status: NonConformityStatus;
  correctiveAction: string;
  responsibleId: string;
  createdAt: string;
  closedAt?: string;
}

export interface ServiceTemplateItem {
  areaId: AreaId;
  name: string;
  type: PhaseType;
  qualityType?: QualityRecordType;
  requiresDocument?: string;
}

export interface ServiceTemplate {
  id: string;
  name: string;
  mode: ServiceMode;
  scope: ServiceScope;
  description: string;
  items: ServiceTemplateItem[];
}

export interface PreviewDatabase {
  users: User[];
  clients: Client[];
  components: Component[];
  assets: Asset[];
  serviceOrders: ServiceOrder[];
  serviceTemplates: ServiceTemplate[];
  fieldJobs: FieldJob[];
  projects: Project[];
  supplyOrders: SupplyOrder[];
  qualityRecords: QualityRecord[];
  nonConformities: NonConformity[];
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

export interface NewServiceOrderInput {
  mode: ServiceMode;
  clientId: string;
  assetId: string;
  site: string;
  scope: ServiceScope;
  description: string;
  priority: Priority;
  dueDate: string;
  templateId?: string;
  fieldSite?: {
    siteName: string;
    location: string;
    permits: string;
    riskAnalysis: string;
    crew: string;
    containers: number;
    cranes: string;
  };
  projectName?: string;
  supplyItems?: Array<{ name: string; code: string; quantity: number }>;
}

export interface NewQualityRecordInput {
  serviceOrderId: string;
  routeSheetId?: string;
  phaseId?: string;
  type: QualityRecordType;
  method: string;
  standard: string;
  acceptanceCriteria: string;
  inspectorId?: string;
  notes?: string;
}

export interface NewNonConformityInput {
  serviceOrderId: string;
  description: string;
  severity: NonConformitySeverity;
  correctiveAction: string;
  responsibleId: string;
}

export interface ServiceOrderWithRelations extends ServiceOrder {
  client?: Client;
  asset?: Asset;
  creator: User;
  routeSheet?: RouteSheetWithRelations;
  fieldJob?: FieldJob;
  project?: Project;
  supplyOrder?: SupplyOrder;
  qualityRecords: QualityRecord[];
  nonConformities: NonConformity[];
  progress: number;
  openNonConformities: number;
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

export interface FieldJobWithRelations extends FieldJob {
  serviceOrder: ServiceOrder;
  client?: Client;
  asset?: Asset;
}

export interface ProjectWithRelations extends Project {
  serviceOrder: ServiceOrder;
  client?: Client;
  asset?: Asset;
}

export interface SupplyOrderWithRelations extends SupplyOrder {
  serviceOrder: ServiceOrder;
  client?: Client;
  asset?: Asset;
}

