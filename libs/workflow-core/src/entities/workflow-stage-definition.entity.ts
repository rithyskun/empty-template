import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WorkflowDefinition } from './workflow-definition.entity';

@Entity({ name: 'workflow_stage_definitions' })
export class WorkflowStageDefinition {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  workflowDefinitionId!: string;

  @Column()
  stageOrder!: number;

  @Column({ type: 'varchar', length: 50 })
  stageType!: string;

  @Column('varchar', { array: true })
  roleRequired!: string[];

  @Column({ default: 0 })
  deadlineHours!: number;

  @Column({ default: false })
  autoEscalate!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => WorkflowDefinition, (wd) => wd.stages)
  @JoinColumn({ name: 'workflow_definition_id' })
  workflowDefinition!: WorkflowDefinition;
}
