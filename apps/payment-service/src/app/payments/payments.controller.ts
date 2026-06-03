import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { PaymentCoreService } from '@erp/payment-core';
import type {
  CreatePaymentRequestDto,
  UpdatePaymentRequestDto,
} from '@erp/payment-core';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@erp/auth';
import type { UserPayload } from '@erp/auth';
import { PlatformRole } from '@erp/enums';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentCore: PaymentCoreService) {}

  @Post()
  @Roles(PlatformRole.MAKER, PlatformRole.TENANT_ADMIN)
  async create(
    @Body() dto: CreatePaymentRequestDto,
    @CurrentUser() user: UserPayload,
  ) {
    if (!dto.tenantId) dto.tenantId = user.tenantId;
    if (!dto.companyId) dto.companyId = user.companyId;
    return { data: await this.paymentCore.create(dto) };
  }

  @Get()
  @Roles(
    PlatformRole.MAKER,
    PlatformRole.CHECKER,
    PlatformRole.VIEWER,
    PlatformRole.TENANT_ADMIN,
  )
  async list(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @CurrentUser() user?: UserPayload,
  ) {
    const result = await this.paymentCore.list({
      tenantId: user?.tenantId,
      status,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
    return { data: result.data, total: result.total };
  }

  @Get(':id')
  @Roles(
    PlatformRole.MAKER,
    PlatformRole.CHECKER,
    PlatformRole.VIEWER,
    PlatformRole.TENANT_ADMIN,
  )
  async findOne(@Param('id') id: string) {
    const payment = await this.paymentCore.findById(id);
    if (!payment) return { statusCode: 404, message: 'Payment not found' };
    return { data: payment };
  }

  @Patch(':id')
  @Roles(PlatformRole.MAKER, PlatformRole.TENANT_ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdatePaymentRequestDto) {
    return { data: await this.paymentCore.update(id, dto) };
  }

  @Patch(':id/submit')
  @Roles(PlatformRole.MAKER)
  async submit(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return {
      data: await this.paymentCore.updateStatus(
        id,
        'PENDING_APPROVAL',
        user.userId,
      ),
    };
  }

  @Patch(':id/approve')
  @Roles(PlatformRole.CHECKER, PlatformRole.TENANT_ADMIN)
  async approve(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return {
      data: await this.paymentCore.updateStatus(id, 'APPROVED', user.userId),
    };
  }

  @Patch(':id/complete')
  @Roles(PlatformRole.TENANT_ADMIN)
  async complete(
    @Param('id') id: string,
    @Body() body: { providerRef?: string },
    @CurrentUser() user: UserPayload,
  ) {
    return {
      data: await this.paymentCore.updateStatus(
        id,
        'COMPLETED',
        user.userId,
        body.providerRef,
      ),
    };
  }

  @Patch(':id/fail')
  @Roles(PlatformRole.TENANT_ADMIN)
  async fail(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return {
      data: await this.paymentCore.updateStatus(id, 'FAILED', user.userId),
    };
  }

  @Patch(':id/reverse')
  @Roles(PlatformRole.TENANT_ADMIN)
  async reverse(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return {
      data: await this.paymentCore.updateStatus(id, 'REVERSED', user.userId),
    };
  }

  @Delete(':id')
  @Roles(PlatformRole.TENANT_ADMIN)
  async remove(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    await this.paymentCore.delete(id, user.userId);
    return { data: { id }, message: 'Payment deleted' };
  }
}
