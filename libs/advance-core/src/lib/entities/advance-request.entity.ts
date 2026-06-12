import { Entity, Column, OneToMany } from 'typeorm';
import { AuditableEntity } from '@erp/common';
import { AdvanceRepayment } from './advance-repayment.entity';
import { AdvanceRequestItem } from './advance-request-item.entity';

@Entity('advance_requests')
export class AdvanceRequest extends AuditableEntity {
  @Column({ length: 50 })
  requestNo!: string;

  @Column({
    type: 'enum',
    enum: ['DEPARTMENT', 'TRAVEL'],
    default: 'DEPARTMENT',
  })
  type!: 'DEPARTMENT' | 'TRAVEL';

  @Column('uuid')
  employeeId!: string;

  @Column({ type: 'date', nullable: true })
  requestDate!: Date;

  @Column({ length: 100, nullable: true })
  requesterName!: string;

  @Column({ length: 100, nullable: true })
  requesterPosition!: string;

  @Column({ length: 100, nullable: true })
  department!: string;

  @Column({ length: 100, nullable: true })
  contactStaffName!: string;

  @Column({ length: 100, nullable: true })
  contactStaffPosition!: string;

  @Column({ length: 50, nullable: true })
  contactStaffPhone!: string;

  @Column({ type: 'date', nullable: true })
  expectedSettleDate!: Date;

  @Column('text', { nullable: true })
  purpose!: string;

  @Column({ length: 100, nullable: true })
  accountName!: string;

  @Column({ length: 50, nullable: true })
  accountNumber!: string;

  // Travel-specific fields
  @Column({ length: 100, nullable: true })
  country!: string;

  @Column({ length: 100, nullable: true })
  cityProvince!: string;

  @Column({ length: 100, nullable: true })
  travelFrom!: string;

  @Column({ length: 100, nullable: true })
  travelTo!: string;

  @Column({ type: 'int', nullable: true })
  numberOfDays!: number;

  @Column('text', { nullable: true })
  missionPurpose!: string;

  @Column({ length: 50, nullable: true })
  payrollAccountNumber!: string;

  @Column('text', { nullable: true })
  remarks!: string;

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

  @Column({ type: 'timestamptz', nullable: true })
  disbursedAt!: Date;

  @Column({ length: 100, nullable: true })
  approvedByName!: string;

  @Column({ length: 100, nullable: true })
  approvedByPosition!: string;

  @Column({ length: 100, nullable: true })
  checkedByName!: string;

  @Column({ length: 100, nullable: true })
  checkedByPosition!: string;

  @Column({ type: 'timestamptz', nullable: true })
  checkedAt!: Date;

  @OneToMany(() => AdvanceRepayment, (r) => r.advanceRequest)
  repayments!: AdvanceRepayment[];

  @OneToMany(() => AdvanceRequestItem, (i) => i.advanceRequest)
  items!: AdvanceRequestItem[];
}
