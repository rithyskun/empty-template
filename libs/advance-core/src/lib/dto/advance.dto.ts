export interface CreateAdvanceRequestDto {
  requestNo?: string;
  employeeId: string;
  amount: number;
  currency?: string;
  reason?: string;
  repaymentTerms?: number;
  tenantId?: string;
  companyId?: string;
  branchId?: string;
  createdBy?: string;
}

export interface UpdateAdvanceRequestDto {
  amount?: number;
  currency?: string;
  reason?: string;
  repaymentTerms?: number;
  updatedBy?: string;
}

export interface AdvanceRequestResponseDto {
  id: string;
  requestNo: string;
  employeeId: string;
  amount: number;
  currency: string;
  reason?: string;
  repaymentTerms: number;
  status: string;
  workflowInstanceId?: string;
  disbursedAt?: Date;
  tenantId?: string;
  companyId?: string;
  branchId?: string;
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  repayments?: AdvanceRepaymentResponseDto[];
}

export interface CreateAdvanceRepaymentDto {
  advanceRequestId: string;
  installmentNo: number;
  dueDate: Date;
  amount: number;
  paid?: boolean;
  paidAt?: Date;
  payrollRunId?: string;
}

export interface AdvanceRepaymentResponseDto {
  id: string;
  advanceRequestId: string;
  installmentNo: number;
  dueDate: Date;
  amount: number;
  paid: boolean;
  paidAt?: Date;
  payrollRunId?: string;
  createdAt: Date;
  updatedAt: Date;
}
