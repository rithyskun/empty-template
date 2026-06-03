import { Entity, Column, Index } from 'typeorm';
import { AuditableEntity } from '@erp/common';
import { AuditAction, AuditEntityType } from './audit.enum';

@Entity('audit_logs')
@Index('IDX_AL_TENANT_ENTITY', ['tenantId', 'entityType', 'entityId'])
@Index('IDX_AL_TENANT_ACTION', ['tenantId', 'action'])
@Index('IDX_AL_PERFORMED_AT', ['performedAt'])
export class AuditLogEntry extends AuditableEntity {
  @Column({ type: 'varchar', length: 50 })
  action!: AuditAction;

  @Column({ type: 'varchar', length: 100 })
  entityType!: AuditEntityType;

  @Column('uuid')
  entityId!: string;

  @Column({ type: 'jsonb', nullable: true })
  previousValues!: Record<string, unknown> | null;

  @Column({ type: 'jsonb' })
  newValues!: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @Column('uuid')
  performedBy!: string;

  @Column({ type: 'timestamptz' })
  performedAt!: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  sourceIp!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  correlationId!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userAgent!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;
}
