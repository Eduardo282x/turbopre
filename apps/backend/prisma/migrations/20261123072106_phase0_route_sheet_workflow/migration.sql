-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_route_sheet_id_fkey";

-- DropIndex
DROP INDEX "tasks_route_sheet_id_sequence_idx";

-- AlterTable
ALTER TABLE "route_sheets" ADD COLUMN     "inspection_id" TEXT;

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "stage" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX "route_sheets_inspection_id_idx" ON "route_sheets"("inspection_id");

-- CreateIndex
CREATE INDEX "tasks_route_sheet_id_stage_sequence_idx" ON "tasks"("route_sheet_id", "stage", "sequence");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_route_sheet_id_fkey" FOREIGN KEY ("route_sheet_id") REFERENCES "route_sheets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_sheets" ADD CONSTRAINT "route_sheets_inspection_id_fkey" FOREIGN KEY ("inspection_id") REFERENCES "inspections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
