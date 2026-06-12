import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import type { AdvanceRequest } from './advance-request.entity';

@Entity('advance_request_items')
export class AdvanceRequestItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  advanceRequestId!: string;

  @Column()
  itemNo!: number;

  @Column({ length: 50, nullable: true })
  itemType!: string;

  @Column({ length: 255, nullable: true })
  description!: string;

  @Column({ length: 3, default: 'USD' })
  currency!: string;

  @Column('decimal', { precision: 18, scale: 2 })
  amount!: number;

  @Column({ type: 'int', nullable: true })
  numberOfDays!: number;

  @Column('decimal', { precision: 18, scale: 2, nullable: true })
  rate!: number;

  @Column({ length: 255, nullable: true })
  remark!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(
    () => require('./advance-request.entity').AdvanceRequest,
    (r: AdvanceRequest) => r.items,
  )
  @JoinColumn({ name: 'advance_request_id' })
  advanceRequest!: AdvanceRequest;
}
