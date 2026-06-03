export interface CreateWorkflowDefinitionDto {
  name: string;
  code: string;
  description?: string;
  stages: CreateWorkflowStageDefinitionDto[];
  tenantId?: string;
  createdBy?: string;
}

export interface CreateWorkflowStageDefinitionDto {
  stageOrder: number;
  stageType: string;
  roleRequired: string[];
  deadlineHours?: number;
  autoEscalate?: boolean;
}

export interface UpdateWorkflowDefinitionDto {
  name?: string;
  description?: string;
  updatedBy?: string;
}

export interface WorkflowDefinitionResponseDto {
  id: string;
  name: string;
  code: string;
  description?: string;
  stages?: WorkflowStageDefinitionResponseDto[];
  tenantId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowStageDefinitionResponseDto {
  id: string;
  workflowDefinitionId: string;
  stageOrder: number;
  stageType: string;
  roleRequired: string[];
  deadlineHours: number;
  autoEscalate: boolean;
}
