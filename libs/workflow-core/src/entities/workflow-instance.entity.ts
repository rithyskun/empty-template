import { Entity, Column, OneToMany } from 'typeorm';
import { AuditableEntity } from '@erp/common';
import { WorkflowStage } from './workflow-stage.entity';

@Entity({ name: 'workflow_instances' })
export class WorkflowInstance extends AuditableEntity {
  @Column({ type: 'varchar', length: 100 })
  workflowCode!: string;

  @Column({ type: 'varchar', length: 100 })
  entityType!: string;

  @Column('uuid')
  entityId!: string;

  @Column({ type: 'varchar', length: 50, default: 'DRAFT' })
  status!: string;

  @Column({ default: 0 })
  currentStage!: number;

  @OneToMany(() => WorkflowStage, (ws) => ws.workflowInstance, {
    cascade: true,
  })
  stages!: WorkflowStage[];
}
