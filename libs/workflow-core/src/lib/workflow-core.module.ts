import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowCoreService } from './workflow-core.service';
import { WorkflowDefinition } from '../entities/workflow-definition.entity';
import { WorkflowStageDefinition } from '../entities/workflow-stage-definition.entity';
import { WorkflowInstance } from '../entities/workflow-instance.entity';
import { WorkflowStage } from '../entities/workflow-stage.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkflowDefinition,
      WorkflowStageDefinition,
      WorkflowInstance,
      WorkflowStage,
    ]),
  ],
  providers: [WorkflowCoreService],
  exports: [WorkflowCoreService, TypeOrmModule],
})
export class WorkflowCoreModule {}
