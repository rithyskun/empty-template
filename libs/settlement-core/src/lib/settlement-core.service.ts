import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@erp/common';
import { SettlementBatch } from './entities/settlement-batch.entity';
import { SettlementTransaction } from './entities/settlement-transaction.entity';
import type {
  CreateSettlementBatchDto,
  UpdateSettlementBatchDto,
  SettlementBatchResponseDto,
  CreateSettlementTransactionDto,
  SettlementTransactionResponseDto,
} from './dto/settlement.dto';

@Injectable()
export class SettlementCoreService {
  constructor(
    @InjectRepository(SettlementBatch)
    private readonly batchRepo: Repository<SettlementBatch>,
    @InjectRepository(SettlementTransaction)
    private readonly transactionRepo: Repository<SettlementTransaction>,
  ) {}

  async createBatch(
    dto: CreateSettlementBatchDto,
  ): Promise<SettlementBatchResponseDto> {
    const entity = this.batchRepo.create(dto);
    const saved = await this.batchRepo.save(entity);
    return this.toBatchResponse(saved);
  }

  async findBatchById(id: string): Promise<SettlementBatchResponseDto> {
    const entity = await this.batchRepo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('SettlementBatch', id);
    return this.toBatchResponse(entity);
  }

  async listBatches(): Promise<SettlementBatchResponseDto[]> {
    const entities = await this.batchRepo.find();
    return entities.map((e) => this.toBatchResponse(e));
  }

  async updateBatch(
    id: string,
    dto: UpdateSettlementBatchDto,
  ): Promise<SettlementBatchResponseDto> {
    const entity = await this.batchRepo.preload({ id, ...dto });
    if (!entity) throw new NotFoundException('SettlementBatch', id);
    const saved = await this.batchRepo.save(entity);
    return this.toBatchResponse(saved);
  }

  async deleteBatch(id: string): Promise<void> {
    const entity = await this.batchRepo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('SettlementBatch', id);
    await this.batchRepo.softRemove(entity);
  }

  async createTransaction(
    dto: CreateSettlementTransactionDto,
  ): Promise<SettlementTransactionResponseDto> {
    const entity = this.transactionRepo.create(dto);
    const saved = await this.transactionRepo.save(entity);
    return this.toTransactionResponse(saved);
  }

  async listTransactionsByBatch(
    batchId: string,
  ): Promise<SettlementTransactionResponseDto[]> {
    const entities = await this.transactionRepo.find({ where: { batchId } });
    return entities.map((e) => this.toTransactionResponse(e));
  }

  private toBatchResponse(entity: SettlementBatch): SettlementBatchResponseDto {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      companyId: entity.companyId,
      branchId: entity.branchId,
      batchNo: entity.batchNo,
      settlementType: entity.settlementType,
      totalAmount: entity.totalAmount,
      currency: entity.currency,
      scheduledDate: entity.scheduledDate,
      executedAt: entity.executedAt,
      status: entity.status,
      workflowInstanceId: entity.workflowInstanceId,
      createdBy: entity.createdBy,
      updatedBy: entity.updatedBy,
      approvedBy: entity.approvedBy,
      approvedAt: entity.approvedAt,
      traceId: entity.traceId,
      isDeleted: entity.isDeleted,
      deletedAt: entity.deletedAt,
      deletedBy: entity.deletedBy,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      version: entity.version,
    };
  }

  private toTransactionResponse(
    entity: SettlementTransaction,
  ): SettlementTransactionResponseDto {
    return {
      id: entity.id,
      batchId: entity.batchId,
      tenantId: entity.tenantId,
      companyId: entity.companyId,
      branchId: entity.branchId,
      employeeId: entity.employeeId,
      vendorId: entity.vendorId,
      customerId: entity.customerId,
      amount: entity.amount,
      currency: entity.currency,
      paymentType: entity.paymentType,
      accountNumber: entity.accountNumber,
      reference: entity.reference,
      status: entity.status,
      paymentId: entity.paymentId,
      createdBy: entity.createdBy,
      updatedBy: entity.updatedBy,
      isDeleted: entity.isDeleted,
      deletedAt: entity.deletedAt,
      deletedBy: entity.deletedBy,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      version: entity.version,
    };
  }
}
