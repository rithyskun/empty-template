import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Queues, Jobs } from '@erp/constants';
import { AuditAction, AuditEntityType } from './audit.enum';

export interface AuditRecord {
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  previousValues: Record<string, unknown> | null;
  newValues: Record<string, unknown>;
  metadata: Record<string, unknown> | null;
  performedBy: string;
  tenantId: string;
  companyId: string;
  branchId: string;
  sourceIp?: string;
  correlationId?: string;
  userAgent?: string;
  description?: string;
  traceId?: string;
}

@Injectable()
export class AuditCoreService {
  constructor(
    @InjectQueue(Queues.AUDIT_LOG)
    private readonly auditQueue: Queue,
  ) {}

  async record(record: AuditRecord): Promise<void> {
    await this.auditQueue.add(Jobs.RECORD_AUDIT, record, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
  }

  async recordBulk(records: AuditRecord[]): Promise<void> {
    await this.auditQueue.addBulk(
      records.map((r) => ({
        name: Jobs.RECORD_AUDIT,
        data: r,
        opts: { attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
      })),
    );
  }
}
