import { Entity, Column, OneToMany } from 'typeorm';
import { AuditableEntity } from '@erp/common';
import { WorkflowStageDefinition } from './workflow-stage-definition.entity';

@Entity({ name: 'workflow_definitions' })
export class WorkflowDefinition extends AuditableEntity {
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 100 })
  code!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @OneToMany(() => WorkflowStageDefinition, (wsd) => wsd.workflowDefinition, {
    cascade: true,
  })
  stages!: WorkflowStageDefinition[];
}
