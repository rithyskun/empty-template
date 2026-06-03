export interface PaymentProvider {
  readonly providerCode: string;
  transfer(request: TransferRequest): Promise<TransferResult>;
  inquiry(referenceId: string): Promise<InquiryResult>;
  reverse(referenceId: string, reason: string): Promise<ReverseResult>;
}

export interface TransferRequest {
  idempotencyKey: string;
  amount: number;
  currency: string;
  fromAccount: string;
  toAccount: string;
  reference: string;
  narration: string;
}

export interface TransferResult {
  providerRef: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  message: string;
  processedAt: Date;
}

export interface InquiryResult {
  providerRef: string;
  status: string;
  amount: number;
  settledAt?: Date;
}

export interface ReverseResult {
  providerRef: string;
  status: string;
  message: string;
}
