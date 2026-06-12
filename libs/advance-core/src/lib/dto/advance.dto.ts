export interface CreateAdvanceRequestItemDto {
  itemNo: number;
  itemType?: string;
  description?: string;
  currency?: string;
  amount: number;
  numberOfDays?: number;
  rate?: number;
  remark?: string;
}

export interface AdvanceRequestItemResponseDto {
  id: string;
  advanceRequestId: string;
  itemNo: number;
  itemType?: string;
  description?: string;
  currency: string;
  amount: number;
  numberOfDays?: number;
  rate?: number;
  remark?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAdvanceRequestDto {
  requestNo?: string;
  type?: 'DEPARTMENT' | 'TRAVEL';
  employeeId: string;
  requestDate?: Date;
  requesterName?: string;
  requesterPosition?: string;
  department?: string;
  contactStaffName?: string;
  contactStaffPosition?: string;
  contactStaffPhone?: string;
  expectedSettleDate?: Date;
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
  currency?: string;
  reason?: string;
  repaymentTerms?: number;
  tenantId?: string;
  companyId?: string;
  branchId?: string;
  createdBy?: string;
  items?: CreateAdvanceRequestItemDto[];
}

export interface UpdateAdvanceRequestDto {
  requestDate?: Date;
  requesterName?: string;
  requesterPosition?: string;
  department?: string;
  contactStaffName?: string;
  contactStaffPosition?: string;
  contactStaffPhone?: string;
  expectedSettleDate?: Date;
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
  amount?: number;
  currency?: string;
  reason?: string;
  repaymentTerms?: number;
  status?: string;
  updatedBy?: string;
  items?: CreateAdvanceRequestItemDto[];
}

export interface AdvanceRequestResponseDto {
  id: string;
  requestNo: string;
  type: 'DEPARTMENT' | 'TRAVEL';
  employeeId: string;
  requestDate?: Date;
  requesterName?: string;
  requesterPosition?: string;
  department?: string;
  contactStaffName?: string;
  contactStaffPosition?: string;
  contactStaffPhone?: string;
  expectedSettleDate?: Date;
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
  approvedByName?: string;
  approvedByPosition?: string;
  approvedAt?: Date;
  checkedByName?: string;
  checkedByPosition?: string;
  checkedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  repayments?: AdvanceRepaymentResponseDto[];
  items?: AdvanceRequestItemResponseDto[];
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
