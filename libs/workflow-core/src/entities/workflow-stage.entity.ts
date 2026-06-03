import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WorkflowInstance } from './workflow-instance.entity';

@Entity({ name: 'workflow_stages' })
export class WorkflowStage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  workflowInstanceId!: string;

  @Column()
  stageOrder!: number;

  @Column({ type: 'varchar', length: 50 })
  stageType!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  assignedRole!: string;

  @Column('uuid', { nullable: true })
  assignedUser!: string;

  @Column({ type: 'varchar', length: 50, default: 'PENDING' })
  status!: string;

  @Column({ type: 'text', nullable: true })
  comment!: string;

  @Column({ type: 'timestamptz', nullable: true })
  actedAt!: Date;

  @Column('uuid', { nullable: true })
  actedBy!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => WorkflowInstance, (wi) => wi.stages)
  @JoinColumn({ name: 'workflow_instance_id' })
  workflowInstance!: WorkflowInstance;
}
