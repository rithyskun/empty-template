import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PaymentRequest } from './payment-request.entity';

@Entity('payment_provider_logs')
export class PaymentProviderLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  paymentRequestId!: string;

  @Column({ length: 50 })
  providerCode!: string;

  @Column('jsonb', { nullable: true })
  requestPayload!: Record<string, unknown>;

  @Column('jsonb', { nullable: true })
  responsePayload!: Record<string, unknown>;

  @Column({ length: 50 })
  status!: string;

  @Column({ nullable: true })
  providerRef!: string;

  @Column('text', { nullable: true })
  errorMessage!: string;

  @ManyToOne(() => PaymentRequest)
  @JoinColumn({ name: 'payment_request_id' })
  paymentRequest!: PaymentRequest;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
