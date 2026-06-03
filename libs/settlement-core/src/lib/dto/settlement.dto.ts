export interface CreateSettlementBatchDto {
  batchNo: string;
  settlementType: string;
  totalAmount: number;
  currency?: string;
  scheduledDate?: string;
  executedAt?: Date;
  status?: string;
  workflowInstanceId?: string;
  createdBy?: string;
  updatedBy?: string;
  approvedBy?: string;
  approvedAt?: Date;
  traceId?: string;
}

export type UpdateSettlementBatchDto = Partial<CreateSettlementBatchDto>;

export interface SettlementBatchResponseDto {
  id: string;
  tenantId?: string;
  companyId?: string;
  branchId?: string;
  batchNo: string;
  settlementType: string;
  totalAmount: number;
  currency: string;
  scheduledDate?: string;
  executedAt?: Date;
  status: string;
  workflowInstanceId?: string;
  createdBy?: string;
  updatedBy?: string;
  approvedBy?: string;
  approvedAt?: Date;
  traceId?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface CreateSettlementTransactionDto {
  batchId: string;
  employeeId?: string;
  vendorId?: string;
  customerId?: string;
  amount: number;
  currency?: string;
  paymentType: string;
  accountNumber?: string;
  reference?: string;
  status?: string;
  paymentId?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface SettlementTransactionResponseDto {
  id: string;
  batchId: string;
  tenantId?: string;
  companyId?: string;
  branchId?: string;
  employeeId?: string;
  vendorId?: string;
  customerId?: string;
  amount: number;
  currency: string;
  paymentType: string;
  accountNumber?: string;
  reference?: string;
  status: string;
  paymentId?: string;
  createdBy?: string;
  updatedBy?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}
