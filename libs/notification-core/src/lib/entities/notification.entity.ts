import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  VersionColumn,
} from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { nullable: true })
  tenantId!: string;

  @Column('uuid', { nullable: true })
  companyId!: string;

  @Column('uuid', { nullable: true })
  branchId!: string;

  @Column('uuid', { nullable: true })
  recipientId!: string;

  @Column({ nullable: true })
  recipientEmail!: string;

  @Column({ nullable: true })
  recipientPhone!: string;

  @Column({ length: 20 })
  channel!: string;

  @Column({ nullable: true })
  title!: string;

  @Column('text')
  body!: string;

  @Column({ nullable: true })
  templateCode!: string;

  @Column('jsonb', { nullable: true })
  templateData!: Record<string, unknown>;

  @Column({ nullable: true })
  referenceType!: string;

  @Column('uuid', { nullable: true })
  referenceId!: string;

  @Column({ length: 50, default: 'PENDING' })
  status!: string;

  @Column({ type: 'timestamptz', nullable: true })
  sentAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  readAt!: Date;

  @Column('text', { nullable: true })
  errorMessage!: string;

  @Column('uuid', { nullable: true })
  createdBy!: string;

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
