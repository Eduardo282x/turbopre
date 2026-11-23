-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'SALES', 'WORKSHOP', 'OPERATOR', 'ENGINEER', 'QUALITY', 'PROJECT_MANAGER', 'WAREHOUSE');

-- CreateEnum
CREATE TYPE "ProcessKind" AS ENUM ('WORKSHOP', 'ENGINEERING', 'QUALITY', 'SUPPORT');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ServiceOrderStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'READY_FOR_DELIVERY', 'DELIVERED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RouteSheetStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'RELEASED', 'IN_PROGRESS', 'PENDING_ANNEX_REVIEW', 'PENDING_QUALITY_APPROVAL', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskSource" AS ENUM ('INSPECTION', 'ROUTE_SHEET');

-- CreateEnum
CREATE TYPE "ReviewStage" AS ENUM ('MANAGER_APPROVAL', 'ANNEX_REVIEW', 'QUALITY_APPROVAL');

-- CreateEnum
CREATE TYPE "ReviewDecision" AS ENUM ('APPROVED', 'REJECTED', 'CHANGES_REQUESTED');

-- CreateEnum
CREATE TYPE "AttachmentType" AS ENUM ('PHOTO', 'PDF', 'PLAN', 'CERTIFICATE', 'OTHER');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('SPARE_PART', 'CONSUMABLE', 'TOOL', 'EQUIPMENT');

-- CreateEnum
CREATE TYPE "InventoryUnitStatus" AS ENUM ('AVAILABLE', 'LOANED', 'IN_USE', 'MAINTENANCE', 'RETIRED');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('IN', 'OUT', 'ADJUSTMENT', 'RETURN');

-- CreateEnum
CREATE TYPE "MaterialRequestStatus" AS ENUM ('PENDING', 'PARTIALLY_FULFILLED', 'FULFILLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MaterialRequestItemStatus" AS ENUM ('PENDING', 'IN_STOCK', 'PURCHASE_REQUIRED', 'PURCHASED', 'DELIVERED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('ACTIVE', 'PARTIALLY_RETURNED', 'RETURNED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CalibrationResult" AS ENUM ('PASSED', 'FAILED', 'CONDITIONAL');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNED', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'COMPLETE', 'DELIVER', 'LOGIN', 'STATUS_CHANGE');

-- CreateEnum
CREATE TYPE "AiSuggestionStatus" AS ENUM ('DRAFT', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processes" (
    "id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "ProcessKind" NOT NULL DEFAULT 'WORKSHOP',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "processes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_positions" (
    "id" TEXT NOT NULL,
    "process_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "job_position_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "tax_id" TEXT,
    "contact_name" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "address" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sites" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "serial_number" TEXT,
    "manufacturer" TEXT,
    "model" TEXT,
    "type" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "client_id" TEXT,
    "manager_id" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNED',
    "start_date" TIMESTAMP(3),
    "due_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_orders" (
    "id" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "parent_service_order_id" TEXT,
    "client_id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "equipment_id" TEXT NOT NULL,
    "project_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "ServiceOrderStatus" NOT NULL DEFAULT 'OPEN',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspections" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "service_order_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "technical_details" TEXT,
    "status" "InspectionStatus" NOT NULL DEFAULT 'OPEN',
    "approved_by_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "inspection_id" TEXT,
    "route_sheet_id" TEXT,
    "job_position_id" TEXT NOT NULL,
    "assigned_to_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "sequence" INTEGER,
    "source" "TaskSource" NOT NULL DEFAULT 'ROUTE_SHEET',
    "description" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "requires_evidence" BOOLEAN NOT NULL DEFAULT true,
    "estimated_minutes" INTEGER,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_attachments" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "AttachmentType" NOT NULL DEFAULT 'PHOTO',
    "uploaded_by_id" TEXT NOT NULL,
    "is_selected_for_annex" BOOLEAN,
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_sheets" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "service_order_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "status" "RouteSheetStatus" NOT NULL DEFAULT 'DRAFT',
    "current_location_id" TEXT,
    "released_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "route_sheets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_sheet_reviews" (
    "id" TEXT NOT NULL,
    "route_sheet_id" TEXT NOT NULL,
    "stage" "ReviewStage" NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "decision" "ReviewDecision" NOT NULL,
    "comments" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "route_sheet_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_sheet_documents" (
    "id" TEXT NOT NULL,
    "route_sheet_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "AttachmentType" NOT NULL DEFAULT 'PDF',
    "uploaded_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "route_sheet_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plant_locations" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "process_id" TEXT,
    "map_x" DOUBLE PRECISION,
    "map_y" DOUBLE PRECISION,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plant_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_sheet_location_history" (
    "id" TEXT NOT NULL,
    "route_sheet_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "moved_by_id" TEXT NOT NULL,
    "moved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "route_sheet_location_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "item_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "item_type" "ItemType" NOT NULL DEFAULT 'SPARE_PART',
    "unit" TEXT NOT NULL DEFAULT 'UND',
    "stock_quantity" INTEGER NOT NULL DEFAULT 0,
    "minimum_stock" INTEGER NOT NULL DEFAULT 0,
    "tracks_serial" BOOLEAN NOT NULL DEFAULT false,
    "requires_calibration" BOOLEAN NOT NULL DEFAULT false,
    "is_loanable" BOOLEAN NOT NULL DEFAULT false,
    "storage_location" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_units" (
    "id" TEXT NOT NULL,
    "inventory_item_id" TEXT NOT NULL,
    "serial_number" TEXT NOT NULL,
    "status" "InventoryUnitStatus" NOT NULL DEFAULT 'AVAILABLE',
    "calibration_due_at" TIMESTAMP(3),
    "storage_location" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "inventory_item_id" TEXT NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "reference_type" TEXT,
    "reference_id" TEXT,
    "performed_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_requests" (
    "id" TEXT NOT NULL,
    "request_number" TEXT NOT NULL,
    "service_order_id" TEXT NOT NULL,
    "route_sheet_id" TEXT,
    "requested_by_id" TEXT NOT NULL,
    "status" "MaterialRequestStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "delivered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "material_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_request_items" (
    "id" TEXT NOT NULL,
    "material_request_id" TEXT NOT NULL,
    "inventory_item_id" TEXT,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit" TEXT,
    "status" "MaterialRequestItemStatus" NOT NULL DEFAULT 'PENDING',
    "purchase_notes" TEXT,
    "delivered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "material_request_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loans" (
    "id" TEXT NOT NULL,
    "loan_number" TEXT NOT NULL,
    "received_by_id" TEXT NOT NULL,
    "authorized_by_id" TEXT NOT NULL,
    "service_order_id" TEXT,
    "status" "LoanStatus" NOT NULL DEFAULT 'ACTIVE',
    "loaned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_at" TIMESTAMP(3),
    "returned_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_items" (
    "id" TEXT NOT NULL,
    "loan_id" TEXT NOT NULL,
    "inventory_item_id" TEXT,
    "inventory_unit_id" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "returned_quantity" INTEGER NOT NULL DEFAULT 0,
    "condition_on_return" TEXT,
    "notes" TEXT,

    CONSTRAINT "loan_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calibrations" (
    "id" TEXT NOT NULL,
    "inventory_unit_id" TEXT NOT NULL,
    "performed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "next_due_at" TIMESTAMP(3),
    "result" "CalibrationResult" NOT NULL,
    "certificate_url" TEXT,
    "performed_by_id" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calibrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" "AuditAction" NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "changes" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_route_sheet_suggestions" (
    "id" TEXT NOT NULL,
    "service_order_id" TEXT NOT NULL,
    "requested_by_id" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "response" JSONB NOT NULL,
    "provider" TEXT,
    "model" TEXT,
    "status" "AiSuggestionStatus" NOT NULL DEFAULT 'DRAFT',
    "accepted_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_route_sheet_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "processes_code_key" ON "processes"("code");

-- CreateIndex
CREATE INDEX "processes_department_id_idx" ON "processes"("department_id");

-- CreateIndex
CREATE UNIQUE INDEX "job_positions_code_key" ON "job_positions"("code");

-- CreateIndex
CREATE INDEX "job_positions_process_id_idx" ON "job_positions"("process_id");

-- CreateIndex
CREATE UNIQUE INDEX "job_positions_process_id_name_key" ON "job_positions"("process_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_job_position_id_idx" ON "users"("job_position_id");

-- CreateIndex
CREATE INDEX "users_created_by_id_idx" ON "users"("created_by_id");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_is_active_idx" ON "users"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "clients_code_key" ON "clients"("code");

-- CreateIndex
CREATE UNIQUE INDEX "clients_tax_id_key" ON "clients"("tax_id");

-- CreateIndex
CREATE INDEX "sites_client_id_idx" ON "sites"("client_id");

-- CreateIndex
CREATE UNIQUE INDEX "sites_client_id_name_key" ON "sites"("client_id", "name");

-- CreateIndex
CREATE INDEX "equipment_client_id_idx" ON "equipment"("client_id");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_client_id_code_key" ON "equipment"("client_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "projects_code_key" ON "projects"("code");

-- CreateIndex
CREATE INDEX "projects_client_id_idx" ON "projects"("client_id");

-- CreateIndex
CREATE INDEX "projects_manager_id_idx" ON "projects"("manager_id");

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");

-- CreateIndex
CREATE UNIQUE INDEX "service_orders_order_number_key" ON "service_orders"("order_number");

-- CreateIndex
CREATE INDEX "service_orders_client_id_idx" ON "service_orders"("client_id");

-- CreateIndex
CREATE INDEX "service_orders_site_id_idx" ON "service_orders"("site_id");

-- CreateIndex
CREATE INDEX "service_orders_equipment_id_idx" ON "service_orders"("equipment_id");

-- CreateIndex
CREATE INDEX "service_orders_project_id_idx" ON "service_orders"("project_id");

-- CreateIndex
CREATE INDEX "service_orders_created_by_id_idx" ON "service_orders"("created_by_id");

-- CreateIndex
CREATE INDEX "service_orders_status_idx" ON "service_orders"("status");

-- CreateIndex
CREATE INDEX "service_orders_due_at_idx" ON "service_orders"("due_at");

-- CreateIndex
CREATE INDEX "service_orders_parent_service_order_id_idx" ON "service_orders"("parent_service_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "inspections_code_key" ON "inspections"("code");

-- CreateIndex
CREATE INDEX "inspections_service_order_id_idx" ON "inspections"("service_order_id");

-- CreateIndex
CREATE INDEX "inspections_created_by_id_idx" ON "inspections"("created_by_id");

-- CreateIndex
CREATE INDEX "inspections_approved_by_id_idx" ON "inspections"("approved_by_id");

-- CreateIndex
CREATE INDEX "inspections_status_idx" ON "inspections"("status");

-- CreateIndex
CREATE INDEX "tasks_inspection_id_idx" ON "tasks"("inspection_id");

-- CreateIndex
CREATE INDEX "tasks_route_sheet_id_sequence_idx" ON "tasks"("route_sheet_id", "sequence");

-- CreateIndex
CREATE INDEX "tasks_job_position_id_idx" ON "tasks"("job_position_id");

-- CreateIndex
CREATE INDEX "tasks_assigned_to_id_idx" ON "tasks"("assigned_to_id");

-- CreateIndex
CREATE INDEX "tasks_status_idx" ON "tasks"("status");

-- CreateIndex
CREATE INDEX "task_attachments_task_id_idx" ON "task_attachments"("task_id");

-- CreateIndex
CREATE INDEX "task_attachments_uploaded_by_id_idx" ON "task_attachments"("uploaded_by_id");

-- CreateIndex
CREATE INDEX "task_attachments_reviewed_by_id_idx" ON "task_attachments"("reviewed_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "route_sheets_code_key" ON "route_sheets"("code");

-- CreateIndex
CREATE UNIQUE INDEX "route_sheets_service_order_id_key" ON "route_sheets"("service_order_id");

-- CreateIndex
CREATE INDEX "route_sheets_created_by_id_idx" ON "route_sheets"("created_by_id");

-- CreateIndex
CREATE INDEX "route_sheets_status_idx" ON "route_sheets"("status");

-- CreateIndex
CREATE INDEX "route_sheets_current_location_id_idx" ON "route_sheets"("current_location_id");

-- CreateIndex
CREATE INDEX "route_sheet_reviews_route_sheet_id_stage_idx" ON "route_sheet_reviews"("route_sheet_id", "stage");

-- CreateIndex
CREATE INDEX "route_sheet_reviews_reviewer_id_idx" ON "route_sheet_reviews"("reviewer_id");

-- CreateIndex
CREATE INDEX "route_sheet_documents_route_sheet_id_idx" ON "route_sheet_documents"("route_sheet_id");

-- CreateIndex
CREATE INDEX "route_sheet_documents_uploaded_by_id_idx" ON "route_sheet_documents"("uploaded_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "plant_locations_code_key" ON "plant_locations"("code");

-- CreateIndex
CREATE INDEX "plant_locations_process_id_idx" ON "plant_locations"("process_id");

-- CreateIndex
CREATE INDEX "route_sheet_location_history_route_sheet_id_idx" ON "route_sheet_location_history"("route_sheet_id");

-- CreateIndex
CREATE INDEX "route_sheet_location_history_location_id_idx" ON "route_sheet_location_history"("location_id");

-- CreateIndex
CREATE INDEX "route_sheet_location_history_moved_by_id_idx" ON "route_sheet_location_history"("moved_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "item_categories_name_key" ON "item_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_sku_key" ON "inventory_items"("sku");

-- CreateIndex
CREATE INDEX "inventory_items_category_id_idx" ON "inventory_items"("category_id");

-- CreateIndex
CREATE INDEX "inventory_items_item_type_idx" ON "inventory_items"("item_type");

-- CreateIndex
CREATE INDEX "inventory_items_is_active_idx" ON "inventory_items"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_units_serial_number_key" ON "inventory_units"("serial_number");

-- CreateIndex
CREATE INDEX "inventory_units_inventory_item_id_idx" ON "inventory_units"("inventory_item_id");

-- CreateIndex
CREATE INDEX "inventory_units_status_idx" ON "inventory_units"("status");

-- CreateIndex
CREATE INDEX "inventory_units_calibration_due_at_idx" ON "inventory_units"("calibration_due_at");

-- CreateIndex
CREATE INDEX "stock_movements_inventory_item_id_idx" ON "stock_movements"("inventory_item_id");

-- CreateIndex
CREATE INDEX "stock_movements_performed_by_id_idx" ON "stock_movements"("performed_by_id");

-- CreateIndex
CREATE INDEX "stock_movements_created_at_idx" ON "stock_movements"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "material_requests_request_number_key" ON "material_requests"("request_number");

-- CreateIndex
CREATE INDEX "material_requests_service_order_id_idx" ON "material_requests"("service_order_id");

-- CreateIndex
CREATE INDEX "material_requests_route_sheet_id_idx" ON "material_requests"("route_sheet_id");

-- CreateIndex
CREATE INDEX "material_requests_requested_by_id_idx" ON "material_requests"("requested_by_id");

-- CreateIndex
CREATE INDEX "material_requests_status_idx" ON "material_requests"("status");

-- CreateIndex
CREATE INDEX "material_request_items_material_request_id_idx" ON "material_request_items"("material_request_id");

-- CreateIndex
CREATE INDEX "material_request_items_inventory_item_id_idx" ON "material_request_items"("inventory_item_id");

-- CreateIndex
CREATE INDEX "material_request_items_status_idx" ON "material_request_items"("status");

-- CreateIndex
CREATE UNIQUE INDEX "loans_loan_number_key" ON "loans"("loan_number");

-- CreateIndex
CREATE INDEX "loans_received_by_id_idx" ON "loans"("received_by_id");

-- CreateIndex
CREATE INDEX "loans_authorized_by_id_idx" ON "loans"("authorized_by_id");

-- CreateIndex
CREATE INDEX "loans_service_order_id_idx" ON "loans"("service_order_id");

-- CreateIndex
CREATE INDEX "loans_status_idx" ON "loans"("status");

-- CreateIndex
CREATE INDEX "loan_items_loan_id_idx" ON "loan_items"("loan_id");

-- CreateIndex
CREATE INDEX "loan_items_inventory_item_id_idx" ON "loan_items"("inventory_item_id");

-- CreateIndex
CREATE INDEX "loan_items_inventory_unit_id_idx" ON "loan_items"("inventory_unit_id");

-- CreateIndex
CREATE INDEX "calibrations_inventory_unit_id_idx" ON "calibrations"("inventory_unit_id");

-- CreateIndex
CREATE INDEX "calibrations_performed_by_id_idx" ON "calibrations"("performed_by_id");

-- CreateIndex
CREATE INDEX "calibrations_next_due_at_idx" ON "calibrations"("next_due_at");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "ai_route_sheet_suggestions_service_order_id_idx" ON "ai_route_sheet_suggestions"("service_order_id");

-- CreateIndex
CREATE INDEX "ai_route_sheet_suggestions_requested_by_id_idx" ON "ai_route_sheet_suggestions"("requested_by_id");

-- CreateIndex
CREATE INDEX "ai_route_sheet_suggestions_accepted_by_id_idx" ON "ai_route_sheet_suggestions"("accepted_by_id");

-- AddForeignKey
ALTER TABLE "processes" ADD CONSTRAINT "processes_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_positions" ADD CONSTRAINT "job_positions_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "processes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_job_position_id_fkey" FOREIGN KEY ("job_position_id") REFERENCES "job_positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sites" ADD CONSTRAINT "sites_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_parent_service_order_id_fkey" FOREIGN KEY ("parent_service_order_id") REFERENCES "service_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_service_order_id_fkey" FOREIGN KEY ("service_order_id") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_inspection_id_fkey" FOREIGN KEY ("inspection_id") REFERENCES "inspections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_route_sheet_id_fkey" FOREIGN KEY ("route_sheet_id") REFERENCES "route_sheets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_job_position_id_fkey" FOREIGN KEY ("job_position_id") REFERENCES "job_positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_attachments" ADD CONSTRAINT "task_attachments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_attachments" ADD CONSTRAINT "task_attachments_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_attachments" ADD CONSTRAINT "task_attachments_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_sheets" ADD CONSTRAINT "route_sheets_service_order_id_fkey" FOREIGN KEY ("service_order_id") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_sheets" ADD CONSTRAINT "route_sheets_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_sheets" ADD CONSTRAINT "route_sheets_current_location_id_fkey" FOREIGN KEY ("current_location_id") REFERENCES "plant_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_sheet_reviews" ADD CONSTRAINT "route_sheet_reviews_route_sheet_id_fkey" FOREIGN KEY ("route_sheet_id") REFERENCES "route_sheets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_sheet_reviews" ADD CONSTRAINT "route_sheet_reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_sheet_documents" ADD CONSTRAINT "route_sheet_documents_route_sheet_id_fkey" FOREIGN KEY ("route_sheet_id") REFERENCES "route_sheets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_sheet_documents" ADD CONSTRAINT "route_sheet_documents_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plant_locations" ADD CONSTRAINT "plant_locations_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "processes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_sheet_location_history" ADD CONSTRAINT "route_sheet_location_history_route_sheet_id_fkey" FOREIGN KEY ("route_sheet_id") REFERENCES "route_sheets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_sheet_location_history" ADD CONSTRAINT "route_sheet_location_history_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "plant_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_sheet_location_history" ADD CONSTRAINT "route_sheet_location_history_moved_by_id_fkey" FOREIGN KEY ("moved_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "item_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_units" ADD CONSTRAINT "inventory_units_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_performed_by_id_fkey" FOREIGN KEY ("performed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_requests" ADD CONSTRAINT "material_requests_service_order_id_fkey" FOREIGN KEY ("service_order_id") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_requests" ADD CONSTRAINT "material_requests_route_sheet_id_fkey" FOREIGN KEY ("route_sheet_id") REFERENCES "route_sheets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_requests" ADD CONSTRAINT "material_requests_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_request_items" ADD CONSTRAINT "material_request_items_material_request_id_fkey" FOREIGN KEY ("material_request_id") REFERENCES "material_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_request_items" ADD CONSTRAINT "material_request_items_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_received_by_id_fkey" FOREIGN KEY ("received_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_authorized_by_id_fkey" FOREIGN KEY ("authorized_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_service_order_id_fkey" FOREIGN KEY ("service_order_id") REFERENCES "service_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_items" ADD CONSTRAINT "loan_items_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_items" ADD CONSTRAINT "loan_items_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_items" ADD CONSTRAINT "loan_items_inventory_unit_id_fkey" FOREIGN KEY ("inventory_unit_id") REFERENCES "inventory_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calibrations" ADD CONSTRAINT "calibrations_inventory_unit_id_fkey" FOREIGN KEY ("inventory_unit_id") REFERENCES "inventory_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calibrations" ADD CONSTRAINT "calibrations_performed_by_id_fkey" FOREIGN KEY ("performed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_route_sheet_suggestions" ADD CONSTRAINT "ai_route_sheet_suggestions_service_order_id_fkey" FOREIGN KEY ("service_order_id") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_route_sheet_suggestions" ADD CONSTRAINT "ai_route_sheet_suggestions_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_route_sheet_suggestions" ADD CONSTRAINT "ai_route_sheet_suggestions_accepted_by_id_fkey" FOREIGN KEY ("accepted_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
