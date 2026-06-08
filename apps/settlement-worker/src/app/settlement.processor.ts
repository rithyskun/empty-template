import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { Queues, Jobs } from '@erp/constants';
import { SettlementCoreService } from '@erp/settlement-core';

@Processor(Queues.SETTLEMENT_PROCESS)
export class SettlementProcessor extends WorkerHost {
  private readonly logger = new Logger(SettlementProcessor.name);

  constructor(private readonly settlementCoreService: SettlementCoreService) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case Jobs.PROCESS_SETTLEMENT: {
        this.logger.log(`Processing settlement batch job ${job.id}`);
        const batch = await this.settlementCoreService.findBatchById(
          job.data.batchId,
        );
        this.logger.debug(
          `Loaded settlement batch ${batch.batchNo} (status: ${batch.status})`,
        );
        // TODO: wire actual settlement execution logic
        break;
      }
      case Jobs.RECONCILE_SETTLEMENT: {
        this.logger.log(`Reconciling settlement job ${job.id}`);
        const transactions =
          await this.settlementCoreService.listTransactionsByBatch(
            job.data.batchId,
          );
        this.logger.debug(
          `Reconciling ${transactions.length} settlement transaction(s)`,
        );
        // TODO: wire actual settlement reconciliation logic
        break;
      }
      default:
        this.logger.warn(`Unknown settlement job type: ${job.name}`);
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Settlement job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Settlement job ${job.id} failed: ${error.message}`);
  }
}
