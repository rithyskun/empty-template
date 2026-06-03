import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { SettlementCoreService } from '@erp/settlement-core';
import type {
  CreateSettlementBatchDto,
  UpdateSettlementBatchDto,
} from '@erp/settlement-core';
import { JwtAuthGuard, RolesGuard, Roles } from '@erp/auth';
import { PlatformRole } from '@erp/enums';

@Controller('settlements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettlementsController {
  constructor(private readonly service: SettlementCoreService) {}

  @Post()
  @Roles(PlatformRole.MAKER, PlatformRole.TENANT_ADMIN)
  async create(@Body() dto: CreateSettlementBatchDto) {
    return { data: await this.service.createBatch(dto) };
  }

  @Get()
  @Roles(
    PlatformRole.MAKER,
    PlatformRole.CHECKER,
    PlatformRole.VIEWER,
    PlatformRole.TENANT_ADMIN,
  )
  async list() {
    return { data: await this.service.listBatches() };
  }

  @Get(':id')
  @Roles(
    PlatformRole.MAKER,
    PlatformRole.CHECKER,
    PlatformRole.VIEWER,
    PlatformRole.TENANT_ADMIN,
  )
  async findOne(@Param('id') id: string) {
    return { data: await this.service.findBatchById(id) };
  }

  @Patch(':id')
  @Roles(PlatformRole.MAKER, PlatformRole.TENANT_ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateSettlementBatchDto) {
    return { data: await this.service.updateBatch(id, dto) };
  }

  @Delete(':id')
  @Roles(PlatformRole.TENANT_ADMIN)
  async remove(@Param('id') id: string) {
    await this.service.deleteBatch(id);
    return { data: { id }, message: 'Batch deleted' };
  }

  @Post(':batchId/transactions')
  @Roles(PlatformRole.MAKER, PlatformRole.TENANT_ADMIN)
  async createTransaction(
    @Param('batchId') batchId: string,
    @Body()
    body: {
      batchId?: string;
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
    },
  ) {
    return { data: await this.service.createTransaction({ ...body, batchId }) };
  }

  @Get(':batchId/transactions')
  @Roles(
    PlatformRole.MAKER,
    PlatformRole.CHECKER,
    PlatformRole.VIEWER,
    PlatformRole.TENANT_ADMIN,
  )
  async listTransactions(@Param('batchId') batchId: string) {
    return { data: await this.service.listTransactionsByBatch(batchId) };
  }
}
