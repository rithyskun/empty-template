export interface CreatePaymentRequestDto {
  requestNo: string;
  paymentType: string;
  amount: number;
  currency?: string;
  fromAccount?: string;
  toAccount?: string;
  beneficiaryName?: string;
  reference?: string;
  narration?: string;
  idempotencyKey?: string;
  providerCode?: string;
  tenantId?: string;
  companyId?: string;
  branchId?: string;
}

export interface UpdatePaymentRequestDto {
  amount?: number;
  fromAccount?: string;
  toAccount?: string;
  beneficiaryName?: string;
  reference?: string;
  narration?: string;
}

export interface PaymentRequestResponseDto {
  id: string;
  requestNo: string;
  paymentType: string;
  amount: number;
  currency: string;
  fromAccount?: string;
  toAccount?: string;
  beneficiaryName?: string;
  reference?: string;
  narration?: string;
  status: string;
  providerCode?: string;
  providerRef?: string;
  completedAt?: Date;
  tenantId?: string;
  companyId?: string;
  branchId?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
