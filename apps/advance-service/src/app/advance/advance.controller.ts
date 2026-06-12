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
import { AdvanceCoreService } from '@erp/advance-core';
import type {
  CreateAdvanceRequestDto,
  UpdateAdvanceRequestDto,
  CreateAdvanceRepaymentDto,
} from '@erp/advance-core';
import { FileCoreService } from '@erp/file-core';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@erp/auth';
import type { UserPayload } from '@erp/auth';
import { PlatformRole } from '@erp/enums';

@Controller('advance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdvanceController {
  constructor(
    private readonly service: AdvanceCoreService,
    private readonly fileService: FileCoreService,
  ) {}

  @Post()
  @Roles(PlatformRole.MAKER, PlatformRole.TENANT_ADMIN)
  async create(
    @Body() dto: CreateAdvanceRequestDto,
    @CurrentUser() user: UserPayload,
  ) {
    if (!dto.tenantId) dto.tenantId = user.tenantId;
    if (!dto.companyId) dto.companyId = user.companyId;
    if (!dto.createdBy) dto.createdBy = user.userId;
    return { data: await this.service.createRequest(dto) };
  }

  @Get()
  @Roles(
    PlatformRole.MAKER,
    PlatformRole.CHECKER,
    PlatformRole.VIEWER,
    PlatformRole.TENANT_ADMIN,
  )
  async list(
    @Query('tenantId') tenantId?: string,
    @Query('employeeId') employeeId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @CurrentUser() user?: UserPayload,
  ) {
    const result = await this.service.listRequests({
      tenantId: tenantId || user?.tenantId,
      employeeId,
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
    const data = await this.service.findRequestById(id);
    if (!data) return { statusCode: 404, message: 'Advance request not found' };
    return { data };
  }

  @Patch(':id')
  @Roles(PlatformRole.MAKER, PlatformRole.TENANT_ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateAdvanceRequestDto) {
    return { data: await this.service.updateRequest(id, dto) };
  }

  @Patch(':id/status')
  @Roles(PlatformRole.MAKER, PlatformRole.CHECKER, PlatformRole.TENANT_ADMIN)
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @CurrentUser() user: UserPayload,
  ) {
    return {
      data: await this.service.updateRequestStatus(
        id,
        body.status,
        user.userId,
      ),
    };
  }

  @Delete(':id')
  @Roles(PlatformRole.TENANT_ADMIN)
  async remove(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    await this.service.deleteRequest(id, user.userId);
    return { data: { id }, message: 'Advance request deleted' };
  }

  @Post(':requestId/repayments')
  @Roles(PlatformRole.MAKER, PlatformRole.TENANT_ADMIN)
  async createRepayment(
    @Param('requestId') requestId: string,
    @Body() dto: CreateAdvanceRepaymentDto,
  ) {
    return {
      data: await this.service.createRepayment({
        ...dto,
        advanceRequestId: requestId,
      }),
    };
  }

  @Get(':requestId/repayments')
  @Roles(
    PlatformRole.MAKER,
    PlatformRole.CHECKER,
    PlatformRole.VIEWER,
    PlatformRole.TENANT_ADMIN,
  )
  async listRepayments(@Param('requestId') requestId: string) {
    return { data: await this.service.listRepayments(requestId) };
  }

  @Patch('repayments/:id/paid')
  @Roles(PlatformRole.MAKER, PlatformRole.TENANT_ADMIN)
  async markRepaymentPaid(
    @Param('id') id: string,
    @Body() body?: { paidAt?: Date; payrollRunId?: string },
  ) {
    return {
      data: await this.service.markRepaymentPaid(
        id,
        body?.paidAt,
        body?.payrollRunId,
      ),
    };
  }

  @Post(':requestId/attachments')
  @Roles(PlatformRole.MAKER, PlatformRole.TENANT_ADMIN)
  async addAttachment(
    @Param('requestId') requestId: string,
    @Body()
    body: {
      fileName: string;
      originalName: string;
      mimeType: string;
      size: number;
      storagePath: string;
      url?: string;
    },
    @CurrentUser() user: UserPayload,
  ) {
    const record = await this.fileService.create({
      entityType: 'advance_request',
      entityId: requestId,
      fileName: body.fileName,
      originalName: body.originalName,
      mimeType: body.mimeType,
      size: body.size,
      storagePath: body.storagePath,
      url: body.url,
      tenantId: user.tenantId,
      companyId: user.companyId,
      createdBy: user.userId,
    });
    return { data: record };
  }

  @Get(':requestId/attachments')
  @Roles(
    PlatformRole.MAKER,
    PlatformRole.CHECKER,
    PlatformRole.VIEWER,
    PlatformRole.TENANT_ADMIN,
  )
  async listAttachments(@Param('requestId') requestId: string) {
    return {
      data: await this.fileService.findByEntity('advance_request', requestId),
    };
  }

  @Delete('attachments/:attachmentId')
  @Roles(PlatformRole.MAKER, PlatformRole.TENANT_ADMIN)
  async deleteAttachment(@Param('attachmentId') attachmentId: string) {
    const record = await this.fileService.findOne(attachmentId);
    if (!record) {
      return { statusCode: 404, message: 'Attachment not found' };
    }
    await this.fileService.delete(attachmentId);
    return { data: { id: attachmentId }, message: 'Attachment deleted' };
  }
}
