import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdvanceRequest } from './entities/advance-request.entity';
import { AdvanceRepayment } from './entities/advance-repayment.entity';
import {
  CreateAdvanceRequestDto,
  UpdateAdvanceRequestDto,
  AdvanceRequestResponseDto,
  CreateAdvanceRepaymentDto,
  AdvanceRepaymentResponseDto,
} from './dto/advance.dto';
import { DomainException } from '@erp/common';

@Injectable()
export class AdvanceCoreService {
  constructor(
    @InjectRepository(AdvanceRequest)
    private readonly advanceRepo: Repository<AdvanceRequest>,
    @InjectRepository(AdvanceRepayment)
    private readonly repaymentRepo: Repository<AdvanceRepayment>,
  ) {}

  async createRequest(
    dto: CreateAdvanceRequestDto,
  ): Promise<AdvanceRequestResponseDto> {
    const entity = this.advanceRepo.create(dto);
    const saved = await this.advanceRepo.save(entity);
    return this.toRequestResponse(saved);
  }

  async findRequestById(id: string): Promise<AdvanceRequestResponseDto | null> {
    const entity = await this.advanceRepo.findOne({
      where: { id },
      relations: { repayments: true },
    });
    if (!entity) return null;
    return this.toRequestResponse(entity);
  }

  async listRequests(params: {
    tenantId?: string;
    employeeId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: AdvanceRequestResponseDto[]; total: number }> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const where: Record<string, unknown> = { isDeleted: false };
    if (params.tenantId) where['tenantId'] = params.tenantId;
    if (params.employeeId) where['employeeId'] = params.employeeId;
    if (params.status) where['status'] = params.status;

    const [items, total] = await this.advanceRepo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: { repayments: true },
    });
    return { data: items.map((i) => this.toRequestResponse(i)), total };
  }

  async updateRequest(
    id: string,
    dto: UpdateAdvanceRequestDto,
  ): Promise<AdvanceRequestResponseDto> {
    const entity = await this.advanceRepo.findOne({ where: { id } });
    if (!entity)
      throw new DomainException(
        'Advance request not found',
        'ADVANCE_NOT_FOUND',
      );
    Object.assign(entity, dto);
    const saved = await this.advanceRepo.save(entity);
    return this.toRequestResponse(saved);
  }

  async updateRequestStatus(
    id: string,
    status: string,
    updatedBy?: string,
  ): Promise<AdvanceRequestResponseDto> {
    const entity = await this.advanceRepo.findOne({ where: { id } });
    if (!entity)
      throw new DomainException(
        'Advance request not found',
        'ADVANCE_NOT_FOUND',
      );
    entity.status = status;
    if (updatedBy) entity.updatedBy = updatedBy;
    if (status === 'DISBURSED') entity.disbursedAt = new Date();
    const saved = await this.advanceRepo.save(entity);
    return this.toRequestResponse(saved);
  }

  async deleteRequest(id: string, deletedBy?: string): Promise<void> {
    const entity = await this.advanceRepo.findOne({ where: { id } });
    if (!entity)
      throw new DomainException(
        'Advance request not found',
        'ADVANCE_NOT_FOUND',
      );
    entity.isDeleted = true;
    if (deletedBy) entity.deletedBy = deletedBy;
    await this.advanceRepo.save(entity);
  }

  async createRepayment(
    dto: CreateAdvanceRepaymentDto,
  ): Promise<AdvanceRepaymentResponseDto> {
    const request = await this.advanceRepo.findOne({
      where: { id: dto.advanceRequestId },
    });
    if (!request)
      throw new DomainException(
        'Advance request not found',
        'ADVANCE_NOT_FOUND',
      );
    const entity = this.repaymentRepo.create(dto);
    const saved = await this.repaymentRepo.save(entity);
    return this.toRepaymentResponse(saved);
  }

  async listRepayments(
    advanceRequestId: string,
  ): Promise<AdvanceRepaymentResponseDto[]> {
    const items = await this.repaymentRepo.find({
      where: { advanceRequestId },
      order: { installmentNo: 'ASC' },
    });
    return items.map((i) => this.toRepaymentResponse(i));
  }

  async markRepaymentPaid(
    id: string,
    paidAt?: Date,
    payrollRunId?: string,
  ): Promise<AdvanceRepaymentResponseDto> {
    const entity = await this.repaymentRepo.findOne({ where: { id } });
    if (!entity)
      throw new DomainException('Repayment not found', 'REPAYMENT_NOT_FOUND');
    entity.paid = true;
    entity.paidAt = paidAt || new Date();
    if (payrollRunId) entity.payrollRunId = payrollRunId;
    const saved = await this.repaymentRepo.save(entity);
    return this.toRepaymentResponse(saved);
  }

  calculateEligibleAmount(
    salary: number,
    existingAdvances: number,
    maxPercent = 0.5,
  ): number {
    const maxAllowed = salary * maxPercent;
    const available = maxAllowed - existingAdvances;
    return Math.max(0, available);
  }

  private toRequestResponse(e: AdvanceRequest): AdvanceRequestResponseDto {
    return {
      id: e.id,
      requestNo: e.requestNo,
      employeeId: e.employeeId,
      amount: e.amount,
      currency: e.currency,
      reason: e.reason,
      repaymentTerms: e.repaymentTerms,
      status: e.status,
      workflowInstanceId: e.workflowInstanceId,
      disbursedAt: e.disbursedAt,
      tenantId: e.tenantId,
      companyId: e.companyId,
      branchId: e.branchId,
      createdBy: e.createdBy,
      approvedBy: e.approvedBy,
      approvedAt: e.approvedAt,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
      repayments: e.repayments?.map((r) => this.toRepaymentResponse(r)),
    };
  }

  private toRepaymentResponse(
    e: AdvanceRepayment,
  ): AdvanceRepaymentResponseDto {
    return {
      id: e.id,
      advanceRequestId: e.advanceRequestId,
      installmentNo: e.installmentNo,
      dueDate: e.dueDate,
      amount: e.amount,
      paid: e.paid,
      paidAt: e.paidAt,
      payrollRunId: e.payrollRunId,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    };
  }
}
