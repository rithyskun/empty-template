import { Module } from '@nestjs/common';
import { DatabaseModule } from '@erp/database';
import { SecurityModule } from '@erp/security';
import { WorkflowCoreModule } from '@erp/workflow-core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WorkflowController } from './workflow/workflow.controller';

@Module({
  imports: [DatabaseModule.forRoot(), SecurityModule, WorkflowCoreModule],
  controllers: [AppController, WorkflowController],
  providers: [AppService],
})
export class AppModule {}
