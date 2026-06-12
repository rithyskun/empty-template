export interface FileAttachmentType {
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
  tenantId?: string;
  companyId?: string;
  branchId?: string;
  createdBy?: string;
  updatedBy?: string;
  approvedBy?: string;
  approvedAt?: Date;
  workflowInstanceId?: string;
  traceId?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}
