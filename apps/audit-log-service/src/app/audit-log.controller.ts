import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles, RequestCtx } from '@erp/auth';
import type { RequestContext } from '@erp/auth';
import { PlatformRole } from '@erp/enums';
import { AuditLogEntry } from '@erp/audit-core';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@ApiTags('audit-logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit-logs')
export class AuditLogController {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  @Get()
  @Roles(PlatformRole.SUPER_ADMIN, PlatformRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Query audit logs' })
  async findAll(
    @RequestCtx() ctx: RequestContext,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('action') action?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    const qb = this.dataSource.manager
      .createQueryBuilder(AuditLogEntry, 'al')
      .where('al.tenantId = :tenantId', { tenantId: ctx.tenantId })
      .orderBy('al.performedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(Math.min(limit, 100));

    if (entityType) qb.andWhere('al.entityType = :entityType', { entityType });
    if (entityId) qb.andWhere('al.entityId = :entityId', { entityId });
    if (action) qb.andWhere('al.action = :action', { action });
    if (from) qb.andWhere('al.performedAt >= :from', { from: new Date(from) });
    if (to) qb.andWhere('al.performedAt <= :to', { to: new Date(to) });

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  @Get(':id')
  @Roles(PlatformRole.SUPER_ADMIN, PlatformRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Get single audit log entry' })
  async findOne(@Param('id') id: string, @RequestCtx() ctx: RequestContext) {
    return this.dataSource.manager.findOneOrFail(AuditLogEntry, {
      where: { id, tenantId: ctx.tenantId },
    });
  }
}
