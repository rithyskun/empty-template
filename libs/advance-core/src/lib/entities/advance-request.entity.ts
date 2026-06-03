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
import { AdvanceRepayment } from './advance-repayment.entity';

@Entity('advance_requests')
export class AdvanceRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { nullable: true })
  tenantId!: string;

  @Column('uuid', { nullable: true })
  companyId!: string;

  @Column('uuid', { nullable: true })
  branchId!: string;

  @Column({ length: 50 })
  requestNo!: string;

  @Column('uuid')
  employeeId!: string;

  @Column('decimal', { precision: 18, scale: 2 })
  amount!: number;

  @Column({ length: 3, default: 'USD' })
  currency!: string;

  @Column('text', { nullable: true })
  reason!: string;

  @Column({ default: 1 })
  repaymentTerms!: number;

  @Column({ length: 50, default: 'DRAFT' })
  status!: string;

  @Column('uuid', { nullable: true })
  workflowInstanceId!: string;

  @Column({ type: 'timestamptz', nullable: true })
  disbursedAt!: Date;

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

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ default: false })
  isDeleted!: boolean;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt!: Date;

  @Column('uuid', { nullable: true })
  deletedBy!: string;

  @VersionColumn()
  version!: number;

  @OneToMany(() => AdvanceRepayment, (r) => r.advanceRequest)
  repayments!: AdvanceRepayment[];
}
