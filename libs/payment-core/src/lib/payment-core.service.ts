import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentRequest } from './entities/payment-request.entity';
import { PaymentProviderLog } from './entities/payment-provider-log.entity';
import {
  CreatePaymentRequestDto,
  UpdatePaymentRequestDto,
  PaymentRequestResponseDto,
} from './dto/payment.dto';
import { DomainException } from '@erp/common';

@Injectable()
export class PaymentCoreService {
  constructor(
    @InjectRepository(PaymentRequest)
    private readonly paymentRepo: Repository<PaymentRequest>,
    @InjectRepository(PaymentProviderLog)
    private readonly logRepo: Repository<PaymentProviderLog>,
  ) {}

  async create(
    dto: CreatePaymentRequestDto,
  ): Promise<PaymentRequestResponseDto> {
    if (dto.idempotencyKey) {
      const existing = await this.paymentRepo.findOne({
        where: { idempotencyKey: dto.idempotencyKey },
      });
      if (existing) return this.toResponse(existing);
    }
    const entity = this.paymentRepo.create(dto);
    const saved = await this.paymentRepo.save(entity);
    return this.toResponse(saved);
  }

  async findById(id: string): Promise<PaymentRequestResponseDto | null> {
    const entity = await this.paymentRepo.findOne({ where: { id } });
    if (!entity) return null;
    return this.toResponse(entity);
  }

  async list(params: {
    tenantId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: PaymentRequestResponseDto[]; total: number }> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const where: Record<string, unknown> = { isDeleted: false };
    if (params.tenantId) where['tenantId'] = params.tenantId;
    if (params.status) where['status'] = params.status;

    const [items, total] = await this.paymentRepo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data: items.map((i) => this.toResponse(i)), total };
  }

  async update(
    id: string,
    dto: UpdatePaymentRequestDto,
  ): Promise<PaymentRequestResponseDto> {
    const entity = await this.paymentRepo.findOne({ where: { id } });
    if (!entity)
      throw new DomainException(
        'Payment request not found',
        'PAYMENT_NOT_FOUND',
      );
    Object.assign(entity, dto);
    const saved = await this.paymentRepo.save(entity);
    return this.toResponse(saved);
  }

  async updateStatus(
    id: string,
    status: string,
    updatedBy?: string,
    providerRef?: string,
  ): Promise<PaymentRequestResponseDto> {
    const entity = await this.paymentRepo.findOne({ where: { id } });
    if (!entity)
      throw new DomainException(
        'Payment request not found',
        'PAYMENT_NOT_FOUND',
      );
    entity.status = status;
    if (updatedBy) entity.updatedBy = updatedBy;
    if (providerRef) entity.providerRef = providerRef;
    if (status === 'COMPLETED' || status === 'FAILED')
      entity.completedAt = new Date();
    const saved = await this.paymentRepo.save(entity);
    return this.toResponse(saved);
  }

  async logProviderCall(
    paymentRequestId: string,
    providerCode: string,
    requestPayload: Record<string, unknown>,
    responsePayload: Record<string, unknown>,
    status: string,
    providerRef?: string,
    errorMessage?: string,
  ): Promise<void> {
    await this.logRepo.save(
      this.logRepo.create({
        paymentRequestId,
        providerCode,
        requestPayload,
        responsePayload,
        status,
        providerRef,
        errorMessage,
      }),
    );
  }

  async delete(id: string, deletedBy?: string): Promise<void> {
    const entity = await this.paymentRepo.findOne({ where: { id } });
    if (!entity)
      throw new DomainException(
        'Payment request not found',
        'PAYMENT_NOT_FOUND',
      );
    entity.isDeleted = true;
    if (deletedBy) entity.deletedBy = deletedBy;
    await this.paymentRepo.save(entity);
  }

  private toResponse(e: PaymentRequest): PaymentRequestResponseDto {
    return {
      id: e.id,
      requestNo: e.requestNo,
      paymentType: e.paymentType,
      amount: e.amount,
      currency: e.currency,
      fromAccount: e.fromAccount,
      toAccount: e.toAccount,
      beneficiaryName: e.beneficiaryName,
      reference: e.reference,
      narration: e.narration,
      status: e.status,
      providerCode: e.providerCode,
      providerRef: e.providerRef,
      completedAt: e.completedAt,
      tenantId: e.tenantId,
      companyId: e.companyId,
      branchId: e.branchId,
      createdBy: e.createdBy,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    };
  }
}
