import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  DeleteDateColumn,
  VersionColumn,
} from 'typeorm';

export abstract class AuditableEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'tenant_id', nullable: true })
  tenantId?: string;

  @Column('uuid', { name: 'company_id', nullable: true })
  companyId?: string;

  @Column('uuid', { name: 'branch_id', nullable: true })
  branchId?: string;

  @Column('uuid', { name: 'created_by', nullable: true })
  createdBy?: string;

  @Column('uuid', { name: 'updated_by', nullable: true })
  updatedBy?: string;

  @Column('uuid', { name: 'approved_by', nullable: true })
  approvedBy?: string;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt?: Date;

  @Column('uuid', { name: 'workflow_instance_id', nullable: true })
  workflowInstanceId?: string;

  @Column({ name: 'trace_id', nullable: true })
  traceId?: string;

  @Column({ name: 'is_deleted', default: false })
  isDeleted!: boolean;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt?: Date;

  @Column('uuid', { name: 'deleted_by', nullable: true })
  deletedBy?: string;

  @VersionColumn({ name: 'version' })
  version!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
