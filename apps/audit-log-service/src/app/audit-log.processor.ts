import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Queues, Jobs } from '@erp/constants';
import { AuditLogEntry } from '@erp/audit-core';

@Processor(Queues.AUDIT_LOG)
export class AuditLogProcessor extends WorkerHost {
  private readonly logger = new Logger(AuditLogProcessor.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    super();
  }

  async process(job: Job<any>): Promise<void> {
    if (job.name === Jobs.RECORD_AUDIT) {
      await this.handleRecordAudit(job);
    } else if (job.name === Jobs.PURGE_AUDIT) {
      await this.handlePurgeAudit(job);
    }
  }

  private async handleRecordAudit(job: Job): Promise<void> {
    const {
      action,
      entityType,
      entityId,
      previousValues,
      newValues,
      metadata,
      performedBy,
      tenantId,
      companyId,
      branchId,
      sourceIp,
      correlationId,
      userAgent,
      description,
      traceId,
    } = job.data;

    const entry = this.dataSource.manager.create(AuditLogEntry, {
      action,
      entityType,
      entityId,
      previousValues: previousValues || null,
      newValues,
      metadata: metadata || null,
      performedBy,
      performedAt: new Date(),
      tenantId,
      companyId,
      branchId,
      sourceIp: sourceIp || null,
      correlationId: correlationId || null,
      userAgent: userAgent || null,
      description: description || null,
      traceId: traceId || null,
    });

    await this.dataSource.manager.save(entry);
  }

  private async handlePurgeAudit(job: Job): Promise<void> {
    const { olderThan, tenantId } = job.data;
    const query = this.dataSource.manager
      .createQueryBuilder()
      .delete()
      .from(AuditLogEntry)
      .where('performedAt < :olderThan', { olderThan: new Date(olderThan) });

    if (tenantId) {
      query.andWhere('tenantId = :tenantId', { tenantId });
    }

    const result = await query.execute();
    this.logger.log(
      `Purged ${result.affected} audit log entries older than ${olderThan}`,
    );
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job, error: Error) {
    this.logger.error(`Audit job ${job.id} failed: ${error.message}`);
  }
}
