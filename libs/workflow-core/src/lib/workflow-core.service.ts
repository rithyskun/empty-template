import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@erp/common';
import {
  WorkflowStatus,
  WorkflowStageType,
  WorkflowStageStatus,
} from '@erp/enums';
import { WorkflowDefinition } from '../entities/workflow-definition.entity';
import { WorkflowStageDefinition } from '../entities/workflow-stage-definition.entity';
import { WorkflowInstance } from '../entities/workflow-instance.entity';
import { WorkflowStage } from '../entities/workflow-stage.entity';
import type {
  CreateWorkflowDefinitionDto,
  UpdateWorkflowDefinitionDto,
  WorkflowDefinitionResponseDto,
  WorkflowStageDefinitionResponseDto,
  CreateWorkflowInstanceDto,
  UpdateWorkflowInstanceDto,
  WorkflowInstanceResponseDto,
  WorkflowStageResponseDto,
  ActOnStageDto,
} from '../dto';

const TRANSITIONS: Record<string, string[]> = {
  [WorkflowStatus.DRAFT]: [WorkflowStatus.SUBMITTED, WorkflowStatus.CANCELLED],
  [WorkflowStatus.SUBMITTED]: [
    WorkflowStatus.CHECKED,
    WorkflowStatus.REJECTED,
    WorkflowStatus.DRAFT,
  ],
  [WorkflowStatus.CHECKED]: [
    WorkflowStatus.AUTHORIZED,
    WorkflowStatus.REJECTED,
    WorkflowStatus.SUBMITTED,
  ],
  [WorkflowStatus.AUTHORIZED]: [
    WorkflowStatus.PROCESSING,
    WorkflowStatus.REJECTED,
  ],
  [WorkflowStatus.PROCESSING]: [
    WorkflowStatus.COMPLETED,
    WorkflowStatus.FAILED,
  ],
  [WorkflowStatus.COMPLETED]: [],
  [WorkflowStatus.REJECTED]: [WorkflowStatus.DRAFT],
  [WorkflowStatus.CANCELLED]: [],
  [WorkflowStatus.FAILED]: [WorkflowStatus.PROCESSING],
};

const WORKFLOW_REGISTRY: Record<
  string,
  {
    name: string;
    stages: {
      order: number;
      type: string;
      roleRequired: string[];
      deadlineHours: number;
      autoEscalate: boolean;
    }[];
  }
> = {
  'payment-request': {
    name: 'Payment Request',
    stages: [
      {
        order: 1,
        type: WorkflowStageType.MAKER,
        roleRequired: ['REQUESTER'],
        deadlineHours: 0,
        autoEscalate: false,
      },
      {
        order: 2,
        type: WorkflowStageType.CHECKER,
        roleRequired: ['CHECKER'],
        deadlineHours: 48,
        autoEscalate: true,
      },
      {
        order: 3,
        type: WorkflowStageType.AUTHORIZER,
        roleRequired: ['AUTHORIZER', 'FINANCE_MANAGER'],
        deadlineHours: 72,
        autoEscalate: true,
      },
    ],
  },
  'payroll-run': {
    name: 'Payroll Run',
    stages: [
      {
        order: 1,
        type: WorkflowStageType.MAKER,
        roleRequired: ['PAYROLL_MANAGER'],
        deadlineHours: 0,
        autoEscalate: false,
      },
      {
        order: 2,
        type: WorkflowStageType.CHECKER,
        roleRequired: ['HR_MANAGER'],
        deadlineHours: 24,
        autoEscalate: true,
      },
      {
        order: 3,
        type: WorkflowStageType.AUTHORIZER,
        roleRequired: ['FINANCE_MANAGER'],
        deadlineHours: 24,
        autoEscalate: true,
      },
    ],
  },
  'loan-application': {
    name: 'Loan Application',
    stages: [
      {
        order: 1,
        type: WorkflowStageType.MAKER,
        roleRequired: ['REQUESTER'],
        deadlineHours: 0,
        autoEscalate: false,
      },
      {
        order: 2,
        type: WorkflowStageType.CHECKER,
        roleRequired: ['HR_MANAGER'],
        deadlineHours: 48,
        autoEscalate: true,
      },
      {
        order: 3,
        type: WorkflowStageType.AUTHORIZER,
        roleRequired: ['FINANCE_MANAGER'],
        deadlineHours: 72,
        autoEscalate: true,
      },
    ],
  },
  'journal-entry': {
    name: 'Journal Entry',
    stages: [
      {
        order: 1,
        type: WorkflowStageType.MAKER,
        roleRequired: ['ACCOUNTANT'],
        deadlineHours: 0,
        autoEscalate: false,
      },
      {
        order: 2,
        type: WorkflowStageType.AUTHORIZER,
        roleRequired: ['FINANCE_MANAGER'],
        deadlineHours: 48,
        autoEscalate: true,
      },
    ],
  },
  'advance-request': {
    name: 'Advance Request',
    stages: [
      {
        order: 1,
        type: WorkflowStageType.MAKER,
        roleRequired: ['REQUESTER'],
        deadlineHours: 0,
        autoEscalate: false,
      },
      {
        order: 2,
        type: 'LINE_MANAGER',
        roleRequired: ['LINE_MANAGER'],
        deadlineHours: 48,
        autoEscalate: true,
      },
      {
        order: 3,
        type: 'DEPARTMENT_HEAD',
        roleRequired: ['DEPARTMENT_HEAD'],
        deadlineHours: 48,
        autoEscalate: true,
      },
      {
        order: 4,
        type: WorkflowStageType.CHECKER,
        roleRequired: ['CHECKER'],
        deadlineHours: 48,
        autoEscalate: true,
      },
      {
        order: 5,
        type: 'REVIEWER',
        roleRequired: ['TREASURY'],
        deadlineHours: 24,
        autoEscalate: true,
      },
      {
        order: 6,
        type: WorkflowStageType.AUTHORIZER,
        roleRequired: ['AUTHORIZER', 'FINANCE_MANAGER'],
        deadlineHours: 72,
        autoEscalate: true,
      },
    ],
  },
};

@Injectable()
export class WorkflowCoreService {
  constructor(
    @InjectRepository(WorkflowDefinition)
    private readonly wdRepo: Repository<WorkflowDefinition>,
    @InjectRepository(WorkflowStageDefinition)
    private readonly wsdRepo: Repository<WorkflowStageDefinition>,
    @InjectRepository(WorkflowInstance)
    private readonly wiRepo: Repository<WorkflowInstance>,
    @InjectRepository(WorkflowStage)
    private readonly wsRepo: Repository<WorkflowStage>,
  ) {}

  // ---- WorkflowDefinition CRUD ----

  async createDefinition(
    dto: CreateWorkflowDefinitionDto,
  ): Promise<WorkflowDefinitionResponseDto> {
    const { stages, ...header } = dto;
    const def = this.wdRepo.create(header);
    if (stages) {
      def.stages = stages.map((s) =>
        this.wsdRepo.create({ ...s, workflowDefinitionId: def.id }),
      );
    }
    const saved = await this.wdRepo.save(def);
    return this.toWdResponse(saved);
  }

  async findDefinitionById(id: string): Promise<WorkflowDefinition> {
    const def = await this.wdRepo.findOne({
      where: { id },
      relations: { stages: true },
    });
    if (!def) throw new NotFoundException('WorkflowDefinition', id);
    return def;
  }

  async findDefinitionByCode(code: string): Promise<WorkflowDefinition | null> {
    return this.wdRepo.findOne({
      where: { code },
      relations: { stages: true },
    });
  }

  async listDefinitions(): Promise<WorkflowDefinitionResponseDto[]> {
    const items = await this.wdRepo.find({
      relations: { stages: true },
      order: { createdAt: 'DESC' },
    });
    return items.map((i) => this.toWdResponse(i));
  }

  async updateDefinition(
    id: string,
    dto: UpdateWorkflowDefinitionDto,
  ): Promise<WorkflowDefinitionResponseDto> {
    const def = await this.findDefinitionById(id);
    Object.assign(def, dto);
    const saved = await this.wdRepo.save(def);
    return this.toWdResponse(saved);
  }

  async deleteDefinition(id: string, deletedBy?: string): Promise<void> {
    const def = await this.findDefinitionById(id);
    def.isDeleted = true;
    if (deletedBy) def.deletedBy = deletedBy;
    await this.wdRepo.save(def);
  }

  // ---- WorkflowInstance CRUD ----

  async createInstance(
    dto: CreateWorkflowInstanceDto,
  ): Promise<WorkflowInstanceResponseDto> {
    const instance = this.wiRepo.create(dto);
    const saved = await this.wiRepo.save(instance);
    return this.toWiResponse(saved);
  }

  async findInstanceById(id: string): Promise<WorkflowInstance> {
    const instance = await this.wiRepo.findOne({
      where: { id },
      relations: { stages: true },
    });
    if (!instance) throw new NotFoundException('WorkflowInstance', id);
    return instance;
  }

  async findInstanceByEntity(
    entityType: string,
    entityId: string,
  ): Promise<WorkflowInstance | null> {
    return this.wiRepo.findOne({
      where: { entityType, entityId },
      relations: { stages: true },
    });
  }

  async listInstances(params: {
    tenantId?: string;
    status?: string;
    entityType?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: WorkflowInstanceResponseDto[]; total: number }> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const where: Record<string, unknown> = { isDeleted: false };
    if (params.tenantId) where['tenantId'] = params.tenantId;
    if (params.status) where['status'] = params.status;
    if (params.entityType) where['entityType'] = params.entityType;
    const [items, total] = await this.wiRepo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: { stages: true },
    });
    return { data: items.map((i) => this.toWiResponse(i)), total };
  }

  async updateInstance(
    id: string,
    dto: UpdateWorkflowInstanceDto,
  ): Promise<WorkflowInstanceResponseDto> {
    const instance = await this.findInstanceById(id);
    Object.assign(instance, dto);
    const saved = await this.wiRepo.save(instance);
    return this.toWiResponse(saved);
  }

  async deleteInstance(id: string, deletedBy?: string): Promise<void> {
    const instance = await this.findInstanceById(id);
    instance.isDeleted = true;
    if (deletedBy) instance.deletedBy = deletedBy;
    await this.wiRepo.save(instance);
  }

  // ---- WorkflowStage operations ----

  async initializeStages(
    instanceId: string,
    definitionCode: string,
  ): Promise<WorkflowInstanceResponseDto> {
    const instance = await this.findInstanceById(instanceId);
    const def = WORKFLOW_REGISTRY[definitionCode];
    if (!def) throw new NotFoundException('WorkflowDefinition', definitionCode);

    const stages = def.stages.map((s) =>
      this.wsRepo.create({
        workflowInstanceId: instanceId,
        stageOrder: s.order,
        stageType: s.type,
        assignedRole: s.roleRequired[0],
        status: s.order === 1 ? 'PENDING' : 'PENDING',
      }),
    );
    instance.stages = stages;
    const saved = await this.wiRepo.save(instance);
    return this.toWiResponse(saved);
  }

  async actOnStage(
    instanceId: string,
    stageOrder: number,
    dto: ActOnStageDto,
  ): Promise<WorkflowInstanceResponseDto> {
    const instance = await this.findInstanceById(instanceId);
    const stage = instance.stages.find((s) => s.stageOrder === stageOrder);
    if (!stage)
      throw new NotFoundException(
        'WorkflowStage',
        `${instanceId}:${stageOrder}`,
      );

    if (
      !canTransition(
        stage.status as WorkflowStatus,
        dto.status as WorkflowStatus,
      )
    ) {
      throw new Error(
        `Cannot transition from ${stage.status} to ${dto.status}`,
      );
    }

    stage.status = dto.status;
    stage.comment = dto.comment ?? '';
    stage.actedBy = dto.actedBy ?? '';
    stage.actedAt = new Date();
    stage.updatedAt = new Date();

    if (dto.status === WorkflowStageStatus.APPROVED) {
      const nextStage = instance.stages.find(
        (s) => s.stageOrder === stageOrder + 1,
      );
      if (nextStage) {
        nextStage.status = WorkflowStageStatus.PENDING;
        instance.currentStage = stageOrder + 1;
      } else {
        instance.status = WorkflowStatus.COMPLETED;
        instance.approvedAt = new Date();
        instance.approvedBy = dto.actedBy ?? '';
        instance.currentStage = stageOrder;
      }
    } else if (dto.status === WorkflowStatus.REJECTED) {
      instance.status = WorkflowStatus.REJECTED;
      instance.currentStage = stageOrder;
    }

    await this.wiRepo.save(instance);
    return this.toWiResponse(instance);
  }

  getDefinition(name: string):
    | {
        name: string;
        stages: {
          order: number;
          type: string;
          roleRequired: string[];
          deadlineHours: number;
          autoEscalate: boolean;
        }[];
      }
    | undefined {
    return WORKFLOW_REGISTRY[name];
  }

  getAllDefinitions(): Record<
    string,
    {
      name: string;
      stages: {
        order: number;
        type: string;
        roleRequired: string[];
        deadlineHours: number;
        autoEscalate: boolean;
      }[];
    }
  > {
    return WORKFLOW_REGISTRY;
  }

  // ---- Response mappers ----

  private toWdResponse(e: WorkflowDefinition): WorkflowDefinitionResponseDto {
    return {
      id: e.id,
      name: e.name,
      code: e.code,
      description: e.description,
      stages: e.stages?.map((s) => this.toWsdResponse(s)),
      tenantId: e.tenantId,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    };
  }

  private toWsdResponse(
    s: WorkflowStageDefinition,
  ): WorkflowStageDefinitionResponseDto {
    return {
      id: s.id,
      workflowDefinitionId: s.workflowDefinitionId,
      stageOrder: s.stageOrder,
      stageType: s.stageType,
      roleRequired: s.roleRequired,
      deadlineHours: s.deadlineHours,
      autoEscalate: s.autoEscalate,
    };
  }

  private toWiResponse(e: WorkflowInstance): WorkflowInstanceResponseDto {
    return {
      id: e.id,
      workflowCode: e.workflowCode,
      entityType: e.entityType,
      entityId: e.entityId,
      status: e.status,
      currentStage: e.currentStage,
      stages: e.stages?.map((s) => this.toWsResponse(s)),
      tenantId: e.tenantId,
      companyId: e.companyId,
      branchId: e.branchId,
      createdBy: e.createdBy,
      updatedBy: e.updatedBy,
      approvedBy: e.approvedBy,
      approvedAt: e.approvedAt,
      traceId: e.traceId,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    };
  }

  private toWsResponse(s: WorkflowStage): WorkflowStageResponseDto {
    return {
      id: s.id,
      workflowInstanceId: s.workflowInstanceId,
      stageOrder: s.stageOrder,
      stageType: s.stageType,
      assignedRole: s.assignedRole,
      assignedUser: s.assignedUser,
      status: s.status,
      comment: s.comment,
      actedAt: s.actedAt,
      actedBy: s.actedBy,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };
  }
}

export function canTransition(
  from: WorkflowStatus,
  to: WorkflowStatus,
): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}
