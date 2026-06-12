import type { WorkflowInstance, WorkflowStage } from './useAdvances';

const baseStages: WorkflowStage[] = [
  {
    id: 's1',
    stageOrder: 1,
    stageType: 'MAKER',
    assignedRole: 'REQUESTER',
    status: 'APPROVED',
    comment: 'Submitted by requester',
    actedAt: '2026-06-01T09:00:00Z',
    actedBy: 'emp-001',
    createdAt: '2026-06-01T08:30:00Z',
  },
  {
    id: 's2',
    stageOrder: 2,
    stageType: 'LINE_MANAGER',
    assignedRole: 'LINE_MANAGER',
    status: 'APPROVED',
    comment: 'Approved by line manager',
    actedAt: '2026-06-02T10:15:00Z',
    actedBy: 'emp-002',
    createdAt: '2026-06-01T08:30:00Z',
  },
  {
    id: 's3',
    stageOrder: 3,
    stageType: 'DEPARTMENT_HEAD',
    assignedRole: 'DEPARTMENT_HEAD',
    status: 'APPROVED',
    comment: 'Approved by VP',
    actedAt: '2026-06-03T14:30:00Z',
    actedBy: 'emp-003',
    createdAt: '2026-06-01T08:30:00Z',
  },
  {
    id: 's4',
    stageOrder: 4,
    stageType: 'CHECKER',
    assignedRole: 'CHECKER',
    status: 'PENDING',
    comment: '',
    actedAt: undefined,
    actedBy: undefined,
    createdAt: '2026-06-01T08:30:00Z',
  },
  {
    id: 's5',
    stageOrder: 5,
    stageType: 'REVIEWER',
    assignedRole: 'TREASURY',
    status: 'PENDING',
    comment: '',
    actedAt: undefined,
    actedBy: undefined,
    createdAt: '2026-06-01T08:30:00Z',
  },
  {
    id: 's6',
    stageOrder: 6,
    stageType: 'AUTHORIZER',
    assignedRole: 'AUTHORIZER',
    status: 'PENDING',
    comment: '',
    actedAt: undefined,
    actedBy: undefined,
    createdAt: '2026-06-01T08:30:00Z',
  },
];

export function getMockWorkflowInstance(
  entityId: string,
  scenario:
    | 'pending-checker'
    | 'pending-line-manager'
    | 'completed'
    | 'rejected' = 'pending-checker',
): WorkflowInstance {
  const now = new Date().toISOString();
  let stages: WorkflowStage[] = JSON.parse(JSON.stringify(baseStages));
  let currentStage = 4;
  let status = 'SUBMITTED';

  switch (scenario) {
    case 'pending-line-manager': {
      stages[1].status = 'PENDING';
      stages[1].actedAt = undefined;
      stages[1].actedBy = undefined;
      stages[2].status = 'PENDING';
      stages[2].actedAt = undefined;
      stages[2].actedBy = undefined;
      currentStage = 2;
      status = 'SUBMITTED';
      break;
    }
    case 'completed': {
      stages = stages.map((s) => ({
        ...s,
        status: 'APPROVED' as const,
        actedAt: s.actedAt ?? now,
        actedBy: s.actedBy ?? 'system',
      }));
      currentStage = 6;
      status = 'COMPLETED';
      break;
    }
    case 'rejected': {
      stages[0].status = 'APPROVED';
      stages[1].status = 'REJECTED';
      stages[1].comment = 'Budget not approved for this quarter';
      stages[1].actedAt = '2026-06-02T10:15:00Z';
      currentStage = 2;
      status = 'REJECTED';
      break;
    }
    default: // pending-checker
      break;
  }

  return {
    id: `wf-${entityId.slice(0, 8)}`,
    workflowCode: 'advance-request',
    entityType: 'advance-request',
    entityId,
    status,
    currentStage,
    stages,
    createdAt: '2026-06-01T08:30:00Z',
    updatedAt: now,
  };
}

let currentMockInstance: WorkflowInstance | null = null;

export function setMockWorkflowInstance(instance: WorkflowInstance) {
  currentMockInstance = instance;
}

export function getCurrentMockInstance(): WorkflowInstance | null {
  return currentMockInstance;
}

export function advanceMockWorkflow(comment?: string): WorkflowInstance | null {
  if (!currentMockInstance) return null;
  const now = new Date().toISOString();
  const instance = currentMockInstance;
  const stage = instance.stages.find(
    (s) => s.stageOrder === instance.currentStage,
  );
  if (!stage) return instance;

  stage.status = 'APPROVED';
  stage.comment = comment ?? '';
  stage.actedAt = now;
  stage.actedBy = 'current-user';

  const nextStage = instance.stages.find(
    (s) => s.stageOrder === stage.stageOrder + 1,
  );
  if (nextStage) {
    nextStage.status = 'PENDING';
    instance.currentStage = nextStage.stageOrder;
  } else {
    instance.status = 'COMPLETED';
  }
  instance.updatedAt = now;
  return instance;
}

export function rejectMockWorkflow(comment?: string): WorkflowInstance | null {
  if (!currentMockInstance) return null;
  const now = new Date().toISOString();
  const instance = currentMockInstance;
  const stage = instance.stages.find(
    (s) => s.stageOrder === instance.currentStage,
  );
  if (!stage) return instance;

  stage.status = 'REJECTED';
  stage.comment = comment ?? '';
  stage.actedAt = now;
  stage.actedBy = 'current-user';
  instance.status = 'REJECTED';
  instance.updatedAt = now;
  return instance;
}
