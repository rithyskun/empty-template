import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AdvanceRequest } from './advance-request.entity';

@Entity('advance_repayments')
export class AdvanceRepayment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  advanceRequestId!: string;

  @Column()
  installmentNo!: number;

  @Column({ type: 'date' })
  dueDate!: Date;

  @Column('decimal', { precision: 18, scale: 2 })
  amount!: number;

  @Column({ default: false })
  paid!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt!: Date;

  @Column('uuid', { nullable: true })
  payrollRunId!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => AdvanceRequest, (r) => r.repayments)
  @JoinColumn({ name: 'advance_request_id' })
  advanceRequest!: AdvanceRequest;
}
