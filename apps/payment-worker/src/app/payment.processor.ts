import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { Queues, Jobs } from '@erp/constants';
import { PaymentCoreService } from '@erp/payment-core';

@Processor(Queues.PAYMENT_EXECUTE)
export class PaymentProcessor extends WorkerHost {
  private readonly logger = new Logger(PaymentProcessor.name);

  constructor(private readonly paymentCoreService: PaymentCoreService) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case Jobs.EXECUTE_PAYMENT: {
        this.logger.log(`Executing payment job ${job.id}`);
        const payment = await this.paymentCoreService.findById(
          job.data.paymentRequestId,
        );
        this.logger.debug(
          `Loaded payment request ${payment?.requestNo ?? 'unknown'} for execution`,
        );
        // TODO: wire actual provider execution logic
        break;
      }
      case Jobs.REVERSE_PAYMENT: {
        this.logger.log(`Reversing payment job ${job.id}`);
        const payment = await this.paymentCoreService.findById(
          job.data.paymentRequestId,
        );
        this.logger.debug(
          `Loaded payment request ${payment?.requestNo ?? 'unknown'} for reversal`,
        );
        // TODO: wire actual reversal logic
        break;
      }
      case Jobs.PAYMENT_INQUIRY: {
        this.logger.log(`Payment inquiry job ${job.id}`);
        const payment = await this.paymentCoreService.findById(
          job.data.paymentRequestId,
        );
        this.logger.debug(
          `Inquiry for payment request ${payment?.requestNo ?? 'unknown'} (status: ${payment?.status ?? 'not found'})`,
        );
        // TODO: wire actual inquiry logic
        break;
      }
      default:
        this.logger.warn(`Unknown job type: ${job.name}`);
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Payment job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Payment job ${job.id} failed: ${error.message}`);
  }
}
