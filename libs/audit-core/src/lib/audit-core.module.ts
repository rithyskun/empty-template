import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { Queues } from '@erp/constants';
import { AuditCoreService } from './audit-core.service';

@Global()
@Module({
  imports: [BullModule.registerQueue({ name: Queues.AUDIT_LOG })],
  providers: [AuditCoreService],
  exports: [AuditCoreService],
})
export class AuditCoreModule {}
