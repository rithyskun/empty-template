import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  VersionColumn,
  OneToMany,
} from 'typeorm';
import { SettlementTransaction } from './settlement-transaction.entity';

@Entity('settlement_batches')
export class SettlementBatch {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { nullable: true })
  tenantId!: string;

  @Column('uuid', { nullable: true })
  companyId!: string;

  @Column('uuid', { nullable: true })
  branchId!: string;

  @Column({ length: 50 })
  batchNo!: string;

  @Column({ length: 50 })
  settlementType!: string;

  @Column('decimal', { precision: 18, scale: 2 })
  totalAmount!: number;

  @Column({ length: 3, default: 'USD' })
  currency!: string;

  @Column({ type: 'date', nullable: true })
  scheduledDate!: string;

  @Column({ type: 'timestamptz', nullable: true })
  executedAt!: Date;

  @Column({ length: 50, default: 'PENDING' })
  status!: string;

  @Column('uuid', { nullable: true })
  workflowInstanceId!: string;

  @Column('uuid', { nullable: true })
  createdBy!: string;

  @Column('uuid', { nullable: true })
  updatedBy!: string;

  @Column('uuid', { nullable: true })
  approvedBy!: string;

  @Column({ type: 'timestamptz', nullable: true })
  approvedAt!: Date;

  @Column({ nullable: true })
  traceId!: string;

  @Column({ default: false })
  isDeleted!: boolean;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt!: Date;

  @Column('uuid', { nullable: true })
  deletedBy!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @VersionColumn()
  version!: number;

  @OneToMany(() => SettlementTransaction, (tx) => tx.batch)
  transactions!: SettlementTransaction[];
}
