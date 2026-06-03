import { Module } from '@nestjs/common';
import { ReconciliationCoreService } from './reconciliation-core.service';

@Module({
  controllers: [],
  providers: [ReconciliationCoreService],
  exports: [ReconciliationCoreService],
})
export class ReconciliationCoreModule {}
