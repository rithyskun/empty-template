import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { Queues, Jobs } from '@erp/constants';
import { NotificationCoreService } from '@erp/notification-core';

@Processor(Queues.NOTIFICATION_SEND)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly notificationCoreService: NotificationCoreService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case Jobs.SEND_EMAIL:
        this.logger.log(`Sending email notification job ${job.id}`);
        await this.notificationCoreService.markSent(job.data.notificationId);
        break;
      case Jobs.SEND_SMS:
        this.logger.log(`Sending SMS notification job ${job.id}`);
        // TODO: wire SMS gateway logic
        break;
      case Jobs.SEND_PUSH:
        this.logger.log(`Sending push notification job ${job.id}`);
        // TODO: wire push notification logic
        break;
      default:
        this.logger.warn(`Unknown notification job type: ${job.name}`);
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Notification job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Notification job ${job.id} failed: ${error.message}`);
    if (job.data?.notificationId) {
      this.notificationCoreService.markFailed(
        job.data.notificationId,
        error.message,
      );
    }
  }
}
