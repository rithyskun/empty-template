import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  VersionColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SettlementBatch } from './settlement-batch.entity';

@Entity('settlement_transactions')
export class SettlementTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  batchId!: string;

  @Column('uuid', { nullable: true })
  tenantId!: string;

  @Column('uuid', { nullable: true })
  companyId!: string;

  @Column('uuid', { nullable: true })
  branchId!: string;

  @Column('uuid', { nullable: true })
  employeeId!: string;

  @Column('uuid', { nullable: true })
  vendorId!: string;

  @Column('uuid', { nullable: true })
  customerId!: string;

  @Column('decimal', { precision: 18, scale: 2 })
  amount!: number;

  @Column({ length: 3, default: 'USD' })
  currency!: string;

  @Column({ length: 50 })
  paymentType!: string;

  @Column({ length: 100, nullable: true })
  accountNumber!: string;

  @Column({ nullable: true })
  reference!: string;

  @Column({ length: 50, default: 'PENDING' })
  status!: string;

  @Column('uuid', { nullable: true })
  paymentId!: string;

  @Column('uuid', { nullable: true })
  createdBy!: string;

  @Column('uuid', { nullable: true })
  updatedBy!: string;

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

  @ManyToOne(() => SettlementBatch, (batch) => batch.transactions)
  @JoinColumn({ name: 'batch_id' })
  batch!: SettlementBatch;
}
