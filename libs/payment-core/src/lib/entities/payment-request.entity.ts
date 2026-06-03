import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  VersionColumn,
} from 'typeorm';

@Entity('payment_requests')
export class PaymentRequest {
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

  @Column({ length: 50 })
  paymentType!: string;

  @Column('decimal', { precision: 18, scale: 2 })
  amount!: number;

  @Column({ length: 3, default: 'USD' })
  currency!: string;

  @Column({ nullable: true })
  fromAccount!: string;

  @Column({ nullable: true })
  toAccount!: string;

  @Column({ nullable: true })
  beneficiaryName!: string;

  @Column({ nullable: true })
  reference!: string;

  @Column('text', { nullable: true })
  narration!: string;

  @Column({ unique: true, nullable: true })
  idempotencyKey!: string;

  @Column({ length: 50, default: 'DRAFT' })
  status!: string;

  @Column('uuid', { nullable: true })
  workflowInstanceId!: string;

  @Column({ length: 50, nullable: true })
  providerCode!: string;

  @Column({ nullable: true })
  providerRef!: string;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt!: Date;

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
}
