export interface CreateWorkflowInstanceDto {
  workflowCode: string;
  entityType: string;
  entityId: string;
  status?: string;
  currentStage?: number;
  tenantId?: string;
  companyId?: string;
  branchId?: string;
  createdBy?: string;
}

export interface UpdateWorkflowInstanceDto {
  status?: string;
  currentStage?: number;
  updatedBy?: string;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface WorkflowInstanceResponseDto {
  id: string;
  workflowCode: string;
  entityType: string;
  entityId: string;
  status: string;
  currentStage: number;
  stages?: WorkflowStageResponseDto[];
  tenantId?: string;
  companyId?: string;
  branchId?: string;
  createdBy?: string;
  updatedBy?: string;
  approvedBy?: string;
  approvedAt?: Date;
  traceId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowStageResponseDto {
  id: string;
  workflowInstanceId: string;
  stageOrder: number;
  stageType: string;
  assignedRole?: string;
  assignedUser?: string;
  status: string;
  comment?: string;
  actedAt?: Date;
  actedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActOnStageDto {
  status: string;
  comment?: string;
  actedBy?: string;
}
