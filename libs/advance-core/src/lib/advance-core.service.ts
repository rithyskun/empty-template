import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdvanceRequest } from './entities/advance-request.entity';
import { AdvanceRepayment } from './entities/advance-repayment.entity';
import { AdvanceRequestItem } from './entities/advance-request-item.entity';
import {
  CreateAdvanceRequestDto,
  UpdateAdvanceRequestDto,
  AdvanceRequestResponseDto,
  AdvanceRequestItemResponseDto,
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
    return this.advanceRepo.manager.transaction(async (manager) => {
      const advanceRepo = manager.getRepository(AdvanceRequest);
      const itemRepo = manager.getRepository(AdvanceRequestItem);

      const { items, ...requestData } = dto;
      const entity = advanceRepo.create(requestData);
      const saved = await advanceRepo.save(entity);

      if (items && items.length > 0) {
        const itemEntities = items.map((item) =>
          itemRepo.create({ ...item, advanceRequestId: saved.id }),
        );
        await itemRepo.save(itemEntities);
      }

      const result = await advanceRepo.findOne({
        where: { id: saved.id },
        relations: { repayments: true, items: true },
      });
      if (!result)
        throw new DomainException(
          'Advance request not found after save',
          'ADVANCE_NOT_FOUND',
        );
      return this.toRequestResponse(result);
    });
  }

  async findRequestById(id: string): Promise<AdvanceRequestResponseDto | null> {
    const entity = await this.advanceRepo.findOne({
      where: { id },
      relations: { repayments: true, items: true },
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
      relations: { repayments: true, items: true },
    });
    return { data: items.map((i) => this.toRequestResponse(i)), total };
  }

  async updateRequest(
    id: string,
    dto: UpdateAdvanceRequestDto,
  ): Promise<AdvanceRequestResponseDto> {
    return this.advanceRepo.manager.transaction(async (manager) => {
      const advanceRepo = manager.getRepository(AdvanceRequest);
      const itemRepo = manager.getRepository(AdvanceRequestItem);

      const entity = await advanceRepo.findOne({
        where: { id },
        relations: { items: true },
      });
      if (!entity)
        throw new DomainException(
          'Advance request not found',
          'ADVANCE_NOT_FOUND',
        );

      const { items, ...requestData } = dto;
      Object.assign(entity, requestData);
      const saved = await advanceRepo.save(entity);

      if (items) {
        await itemRepo.delete({ advanceRequestId: id });
        if (items.length > 0) {
          const itemEntities = items.map((item) =>
            itemRepo.create({ ...item, advanceRequestId: saved.id }),
          );
          await itemRepo.save(itemEntities);
        }
      }

      const result = await advanceRepo.findOne({
        where: { id: saved.id },
        relations: { repayments: true, items: true },
      });
      if (!result)
        throw new DomainException(
          'Advance request not found after update',
          'ADVANCE_NOT_FOUND',
        );
      return this.toRequestResponse(result);
    });
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
      type: e.type,
      employeeId: e.employeeId,
      requestDate: e.requestDate,
      requesterName: e.requesterName,
      requesterPosition: e.requesterPosition,
      department: e.department,
      contactStaffName: e.contactStaffName,
      contactStaffPosition: e.contactStaffPosition,
      contactStaffPhone: e.contactStaffPhone,
      expectedSettleDate: e.expectedSettleDate,
      purpose: e.purpose,
      accountName: e.accountName,
      accountNumber: e.accountNumber,
      country: e.country,
      cityProvince: e.cityProvince,
      travelFrom: e.travelFrom,
      travelTo: e.travelTo,
      numberOfDays: e.numberOfDays,
      missionPurpose: e.missionPurpose,
      payrollAccountNumber: e.payrollAccountNumber,
      remarks: e.remarks,
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
      approvedByName: e.approvedByName,
      approvedByPosition: e.approvedByPosition,
      approvedAt: e.approvedAt,
      checkedByName: e.checkedByName,
      checkedByPosition: e.checkedByPosition,
      checkedAt: e.checkedAt,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
      repayments: e.repayments?.map((r) => this.toRepaymentResponse(r)),
      items: e.items?.map((i) => this.toItemResponse(i)),
    };
  }

  private toItemResponse(e: AdvanceRequestItem): AdvanceRequestItemResponseDto {
    return {
      id: e.id,
      advanceRequestId: e.advanceRequestId,
      itemNo: e.itemNo,
      itemType: e.itemType,
      description: e.description,
      currency: e.currency,
      amount: e.amount,
      numberOfDays: e.numberOfDays,
      rate: e.rate,
      remark: e.remark,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
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
