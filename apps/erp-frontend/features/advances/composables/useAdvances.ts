import { ref, computed } from 'vue';
import { useFetchApi } from '@/composables/useFetchApi';
import {
  getMockWorkflowInstance,
  setMockWorkflowInstance,
  advanceMockWorkflow,
  rejectMockWorkflow,
} from './useAdvanceWorkflowMock';

export interface AdvanceRequestItem {
  id: string;
  itemNo: number;
  itemType?: string;
  description?: string;
  currency: string;
  amount: number;
  numberOfDays?: number;
  rate?: number;
  remark?: string;
  createdAt: string;
}

export interface AdvanceRequest {
  id: string;
  requestNo: string;
  type: 'DEPARTMENT' | 'TRAVEL';
  employeeId: string;
  requestDate?: string;
  requesterName?: string;
  requesterPosition?: string;
  department?: string;
  contactStaffName?: string;
  contactStaffPhone?: string;
  expectedSettleDate?: string;
  purpose?: string;
  accountName?: string;
  accountNumber?: string;
  country?: string;
  cityProvince?: string;
  travelFrom?: string;
  travelTo?: string;
  numberOfDays?: number;
  missionPurpose?: string;
  payrollAccountNumber?: string;
  remarks?: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  items?: AdvanceRequestItem[];
}

export interface AdvanceRepayment {
  id: string;
  advanceRequestId: string;
  installmentNo: number;
  dueDate: string;
  amount: number;
  paid: boolean;
  paidAt?: string;
  payrollRunId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FileAttachment {
  id: string;
  entityType: string;
  entityId: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  storagePath: string;
  storageProvider: string;
  url?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStage {
  id: string;
  stageOrder: number;
  stageType: string;
  assignedRole: string;
  status: string;
  comment?: string;
  actedAt?: string;
  actedBy?: string;
  createdAt: string;
}

export interface WorkflowInstance {
  id: string;
  workflowCode: string;
  entityType: string;
  entityId: string;
  status: string;
  currentStage: number;
  stages: WorkflowStage[];
  createdAt: string;
  updatedAt: string;
}

export interface AdvanceStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  draft: number;
}

export function useAdvances() {
  const api = useFetchApi();
  const requests = ref<AdvanceRequest[]>([]);
  const repayments = ref<AdvanceRepayment[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const currentPage = ref(1);
  const pageSize = ref(10);
  const totalRequests = ref(0);

  const stats = ref<AdvanceStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    draft: 0,
  });

  const workflowInstance = ref<WorkflowInstance | null>(null);

  const totalPages = computed(() =>
    Math.ceil(totalRequests.value / pageSize.value),
  );

  // Computed: all repayments grouped by advance request
  const repaymentsByRequest = computed(() => {
    const map = new Map<string, AdvanceRepayment[]>();
    for (const r of repayments.value) {
      const list = map.get(r.advanceRequestId) ?? [];
      list.push(r);
      map.set(r.advanceRequestId, list);
    }
    return map;
  });

  // Computed: total outstanding balance
  const totalOutstanding = computed(() => {
    return repayments.value
      .filter((r) => !r.paid)
      .reduce((sum, r) => sum + r.amount, 0);
  });

  // Computed: upcoming repayments (next 30 days, unpaid)
  const upcomingRepayments = computed(() => {
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return repayments.value
      .filter((r) => {
        if (r.paid) return false;
        const due = new Date(r.dueDate);
        return due >= now && due <= thirtyDaysLater;
      })
      .sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
      );
  });

  async function loadRequests(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) {
    isLoading.value = true;
    error.value = null;
    try {
      const query = new URLSearchParams();
      if (params?.status) query.append('status', params.status);
      if (params?.page) query.append('page', String(params.page));
      if (params?.limit) query.append('limit', String(params.limit));

      const queryString = query.toString() ? `?${query.toString()}` : '';
      const response = await api.fetchApi<AdvanceRequest[]>(
        `/api/v1/advance${queryString}`,
      );

      requests.value = response.data ?? [];
      totalRequests.value =
        (response as unknown as { total?: number }).total ??
        requests.value.length;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to load advances';
    } finally {
      isLoading.value = false;
    }
  }

  async function loadRepayments(advanceRequestId?: string) {
    isLoading.value = true;
    error.value = null;
    try {
      if (advanceRequestId) {
        const response = await api.fetchApi<AdvanceRepayment[]>(
          `/api/v1/advance/${advanceRequestId}/repayments`,
        );
        repayments.value = response.data ?? [];
      } else {
        // Load repayments for all requests
        repayments.value = [];
        for (const req of requests.value) {
          try {
            const response = await api.fetchApi<AdvanceRepayment[]>(
              `/api/v1/advance/${req.id}/repayments`,
            );
            repayments.value.push(...(response.data ?? []));
          } catch {
            // Skip failed requests
          }
        }
      }
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to load repayments';
    } finally {
      isLoading.value = false;
    }
  }

  async function loadStats() {
    try {
      const response = await api.fetchApi<AdvanceStats>(
        '/api/v1/advance/stats',
      );
      stats.value = response.data;
    } catch {
      // Fallback to computed stats from loaded requests
      stats.value = {
        total: requests.value.length,
        pending: requests.value.filter((r) => r.status === 'PENDING').length,
        approved: requests.value.filter((r) => r.status === 'APPROVED').length,
        rejected: requests.value.filter((r) => r.status === 'REJECTED').length,
        draft: requests.value.filter((r) => r.status === 'DRAFT').length,
      };
    }
  }

  async function createRequest(payload: unknown) {
    return api.postApi<AdvanceRequest>('/api/v1/advance', payload);
  }

  async function loadWorkflowInstance(
    entityId: string,
    scenario?: Parameters<typeof getMockWorkflowInstance>[1],
  ) {
    try {
      const response = await api.fetchApi<WorkflowInstance>(
        `/api/v1/workflows/instances?entityType=advance-request&entityId=${entityId}`,
      );
      // Backend may return an array, take first match
      const data = Array.isArray(response.data)
        ? (response.data as unknown as WorkflowInstance[])[0]
        : response.data;
      workflowInstance.value = data ?? null;
    } catch {
      // Fallback to mock data for UI testing
      const mock = getMockWorkflowInstance(
        entityId,
        scenario ?? 'pending-checker',
      );
      setMockWorkflowInstance(mock);
      workflowInstance.value = mock;
    }
  }

  async function approveWorkflowStage(
    instanceId: string,
    stageOrder: number,
    comment?: string,
  ) {
    if (instanceId.startsWith('wf-')) {
      const updated = advanceMockWorkflow(comment);
      if (updated) workflowInstance.value = { ...updated };
      return { data: updated };
    }
    return api.putApi<WorkflowInstance>(
      `/api/v1/workflows/instances/${instanceId}/stages/${stageOrder}`,
      {
        status: 'APPROVED',
        comment,
      },
    );
  }

  async function rejectWorkflowStage(
    instanceId: string,
    stageOrder: number,
    comment?: string,
  ) {
    if (instanceId.startsWith('wf-')) {
      const updated = rejectMockWorkflow(comment);
      if (updated) workflowInstance.value = { ...updated };
      return { data: updated };
    }
    return api.putApi<WorkflowInstance>(
      `/api/v1/workflows/instances/${instanceId}/stages/${stageOrder}`,
      {
        status: 'REJECTED',
        comment,
      },
    );
  }

  return {
    api,
    requests,
    repayments,
    workflowInstance,
    isLoading,
    error,
    currentPage,
    pageSize,
    totalRequests,
    totalPages,
    stats,
    repaymentsByRequest,
    totalOutstanding,
    upcomingRepayments,
    loadRequests,
    loadRepayments,
    loadStats,
    loadWorkflowInstance,
    approveWorkflowStage,
    rejectWorkflowStage,
    createRequest,
    loadAttachments: (requestId: string) =>
      api.fetchApi<FileAttachment[]>(
        `/api/v1/advance/${requestId}/attachments`,
      ),
    uploadAttachment: (requestId: string, file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.postApi<FileAttachment>(
        `/api/v1/advance/${requestId}/attachments`,
        formData,
        {
          headers: {}, // Let browser set Content-Type with boundary
        },
      );
    },
    deleteAttachment: (attachmentId: string) =>
      api.deleteApi(`/api/v1/advance/attachments/${attachmentId}`),
    downloadAttachment: (attachmentId: string) =>
      api.fetchApi<Blob>(
        `/api/v1/advance/attachments/${attachmentId}/download`,
        { responseType: 'blob' } as unknown as Record<string, string>,
      ),
    uploadWithTus: (
      requestId: string,
      file: File,
      callbacks?: {
        onProgress?: (bytesUploaded: number, bytesTotal: number) => void;
        onSuccess?: () => void;
        onError?: (error: Error) => void;
      },
    ) => {
      return new Promise<void>((resolve, reject) => {
        import('tus-js-client')
          .then(({ Upload }) => {
            const token = localStorage.getItem('accessToken') || '';
            const upload = new Upload(file, {
              endpoint: `${import.meta.env.PROD ? import.meta.env.VITE_API_BASE_URL || '' : ''}/api/v1/files/tus`,
              headers: {
                Authorization: token ? `Bearer ${token}` : '',
              },
              metadata: {
                entityType: 'advance_request',
                entityId: requestId,
                originalName: file.name,
                mimeType: file.type,
              },
              onProgress: (bytesUploaded: number, bytesTotal: number) => {
                callbacks?.onProgress?.(bytesUploaded, bytesTotal);
              },
              onSuccess: () => {
                callbacks?.onSuccess?.();
                resolve();
              },
              onError: (error: Error) => {
                callbacks?.onError?.(error);
                reject(error);
              },
            });
            upload.start();
          })
          .catch(reject);
      });
    },
  };
}
