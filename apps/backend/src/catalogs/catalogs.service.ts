import { BadRequestException, Injectable } from '@nestjs/common';
import type {
  CatalogJobPosition,
  CatalogPlantLocation,
  CatalogProcess,
  CreateDepartmentInput,
  CreateJobPositionInput,
  CreatePlantLocationInput,
  CreateProcessInput,
  Department,
  OrganizationCatalog,
  UpdateDepartmentInput,
  UpdateJobPositionInput,
  UpdatePlantLocationInput,
  UpdateProcessInput,
} from '@turbopre/shared';
import { AuditService } from '../audit/audit.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CatalogsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getOrganization(): Promise<OrganizationCatalog> {
    const [departments, processes, jobPositions, plantLocations] = await Promise.all([
      this.prisma.department.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.process.findMany({
        where: { isActive: true },
        include: { department: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.jobPosition.findMany({
        where: { isActive: true },
        include: { process: { include: { department: true } } },
        orderBy: { name: 'asc' },
      }),
      this.prisma.plantLocation.findMany({
        where: { isActive: true },
        include: { process: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    return {
      departments: departments.map((department) => this.toDepartment(department)),
      processes: processes.map((process) => this.toProcess(process)),
      jobPositions: jobPositions.map((position) => this.toJobPosition(position)),
      plantLocations: plantLocations.map((location) => this.toPlantLocation(location)),
    };
  }

  async createDepartment(
    input: CreateDepartmentInput,
    actorId: string,
  ): Promise<Department> {
    const department = await this.prisma.department.create({ data: input });

    await this.audit.record({
      userId: actorId,
      action: 'CREATE',
      entity: 'Department',
      entityId: department.id,
      changes: { after: { code: department.code, name: department.name } },
    });

    return this.toDepartment(department);
  }

  async updateDepartment(
    id: string,
    input: UpdateDepartmentInput,
    actorId: string,
  ): Promise<Department> {
    const department = await this.prisma.department.update({
      where: { id },
      data: input,
    });

    await this.audit.record({
      userId: actorId,
      action: 'UPDATE',
      entity: 'Department',
      entityId: department.id,
      changes: { after: input },
    });

    return this.toDepartment(department);
  }

  async createProcess(
    input: CreateProcessInput,
    actorId: string,
  ): Promise<CatalogProcess> {
    await this.ensureDepartment(input.departmentId);

    const process = await this.prisma.process.create({
      data: input,
      include: { department: true },
    });

    await this.audit.record({
      userId: actorId,
      action: 'CREATE',
      entity: 'Process',
      entityId: process.id,
      changes: { after: { code: process.code, name: process.name, kind: process.kind } },
    });

    return this.toProcess(process);
  }

  async updateProcess(
    id: string,
    input: UpdateProcessInput,
    actorId: string,
  ): Promise<CatalogProcess> {
    const process = await this.prisma.process.update({
      where: { id },
      data: input,
      include: { department: true },
    });

    await this.audit.record({
      userId: actorId,
      action: 'UPDATE',
      entity: 'Process',
      entityId: process.id,
      changes: { after: input },
    });

    return this.toProcess(process);
  }

  async createJobPosition(
    input: CreateJobPositionInput,
    actorId: string,
  ): Promise<CatalogJobPosition> {
    await this.ensureProcess(input.processId);

    const position = await this.prisma.jobPosition.create({
      data: input,
      include: { process: { include: { department: true } } },
    });

    await this.audit.record({
      userId: actorId,
      action: 'CREATE',
      entity: 'JobPosition',
      entityId: position.id,
      changes: { after: { code: position.code, name: position.name } },
    });

    return this.toJobPosition(position);
  }

  async updateJobPosition(
    id: string,
    input: UpdateJobPositionInput,
    actorId: string,
  ): Promise<CatalogJobPosition> {
    const position = await this.prisma.jobPosition.update({
      where: { id },
      data: input,
      include: { process: { include: { department: true } } },
    });

    await this.audit.record({
      userId: actorId,
      action: 'UPDATE',
      entity: 'JobPosition',
      entityId: position.id,
      changes: { after: input },
    });

    return this.toJobPosition(position);
  }

  async createPlantLocation(
    input: CreatePlantLocationInput,
    actorId: string,
  ): Promise<CatalogPlantLocation> {
    if (input.processId) {
      await this.ensureProcess(input.processId);
    }

    const location = await this.prisma.plantLocation.create({
      data: input,
      include: { process: true },
    });

    await this.audit.record({
      userId: actorId,
      action: 'CREATE',
      entity: 'PlantLocation',
      entityId: location.id,
      changes: { after: { code: location.code, name: location.name } },
    });

    return this.toPlantLocation(location);
  }

  async updatePlantLocation(
    id: string,
    input: UpdatePlantLocationInput,
    actorId: string,
  ): Promise<CatalogPlantLocation> {
    if (input.processId) {
      await this.ensureProcess(input.processId);
    }

    const location = await this.prisma.plantLocation.update({
      where: { id },
      data: input,
      include: { process: true },
    });

    await this.audit.record({
      userId: actorId,
      action: 'UPDATE',
      entity: 'PlantLocation',
      entityId: location.id,
      changes: { after: input },
    });

    return this.toPlantLocation(location);
  }

  private async ensureDepartment(id: string): Promise<void> {
    const department = await this.prisma.department.findUnique({ where: { id } });

    if (!department || !department.isActive) {
      throw new BadRequestException('El departamento no existe o está inactivo');
    }
  }

  private async ensureProcess(id: string): Promise<void> {
    const process = await this.prisma.process.findUnique({ where: { id } });

    if (!process || !process.isActive) {
      throw new BadRequestException('El proceso no existe o está inactivo');
    }
  }

  private toDepartment(department: {
    id: string;
    code: string;
    name: string;
    isActive: boolean;
  }): Department {
    return {
      id: department.id,
      code: department.code,
      name: department.name,
      isActive: department.isActive,
    };
  }

  private toProcess(process: {
    id: string;
    code: string;
    name: string;
    kind: CatalogProcess['kind'];
    departmentId: string;
    isActive: boolean;
    department: { name: string };
  }): CatalogProcess {
    return {
      id: process.id,
      code: process.code,
      name: process.name,
      kind: process.kind,
      departmentId: process.departmentId,
      departmentName: process.department.name,
      isActive: process.isActive,
    };
  }

  private toJobPosition(position: {
    id: string;
    code: string;
    name: string;
    processId: string;
    isActive: boolean;
    process: {
      code: string;
      name: string;
      kind: CatalogJobPosition['processKind'];
      departmentId: string;
      department: { name: string };
    };
  }): CatalogJobPosition {
    return {
      id: position.id,
      code: position.code,
      name: position.name,
      processId: position.processId,
      processCode: position.process.code,
      processName: position.process.name,
      processKind: position.process.kind,
      departmentId: position.process.departmentId,
      departmentName: position.process.department.name,
      isActive: position.isActive,
    };
  }

  private toPlantLocation(location: {
    id: string;
    code: string;
    name: string;
    processId: string | null;
    isActive: boolean;
    process: { name: string } | null;
  }): CatalogPlantLocation {
    return {
      id: location.id,
      code: location.code,
      name: location.name,
      processId: location.processId,
      processName: location.process?.name ?? null,
      isActive: location.isActive,
    };
  }
}
