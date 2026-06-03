import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Queue, QueueEvents } from 'bullmq';

@Injectable()
export class MailQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MailQueueService.name);

  private queue: Queue | null = null;
  private queueEvents: QueueEvents | null = null;
  private redisConnection: any = null;

  onModuleInit() {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = Number(process.env.REDIS_PORT) || 6379;

    this.logger.log(
      `Initializing BullMQ Mail Queue connection to Redis at ${host}:${port}...`,
    );

    try {
      const Redis = require('ioredis');
      this.redisConnection = new Redis({
        host,
        port,
        maxRetriesPerRequest: null,
      });

      this.queue = new Queue('mail-queue', {
        connection: this.redisConnection,
        defaultJobOptions: {
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 10000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      });

      this.queueEvents = new QueueEvents('mail-queue', {
        connection: this.redisConnection,
      });
      this.queueEvents.on('failed', ({ jobId, failedReason }) => {
        this.logger.error(
          `Mail job ${jobId} failed to deliver: ${failedReason}`,
        );
      });

      this.logger.log(
        'BullMQ Mail Queue ("mail-queue") successfully initialized.',
      );
    } catch (err) {
      this.logger.error(
        `Failed to initialize BullMQ Mail Queue: ${(err as Error).message}`,
      );
    }
  }

  async queueMail(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.queue) {
      this.logger.warn(
        `Mail queue is offline. Falling back to immediate, direct/synchronous email sending.`,
      );
      return false;
    }

    try {
      this.logger.debug(`Queueing email background job for: ${to}`);
      await this.queue.add('send-single-email', {
        to,
        subject,
        html,
      });
      return true;
    } catch (err) {
      this.logger.error(
        `Failed to push job onto Mail Queue: ${(err as Error).message}`,
      );
      return false;
    }
  }

  async queueBulkMails(
    jobs: Array<{ to: string; subject: string; html: string }>,
  ): Promise<void> {
    if (!this.queue) {
      this.logger.error('Cannot bulk-queue: Mail queue is offline');
      return;
    }

    try {
      this.logger.log(`Bulk-queueing ${jobs.length} notification emails...`);
      const formattedJobs = jobs.map((job) => ({
        name: 'send-bulk-email',
        data: job,
      }));

      await this.queue.addBulk(formattedJobs);
      this.logger.log(
        `Successfully batched ${jobs.length} jobs onto the "mail-queue".`,
      );
    } catch (err) {
      this.logger.error(
        `Failed to execute bulk queue addition: ${(err as Error).message}`,
      );
    }
  }

  async onModuleDestroy() {
    try {
      if (this.queueEvents) await this.queueEvents.close();
      if (this.queue) await this.queue.close();
      if (this.redisConnection) await this.redisConnection.quit();
      this.logger.log('BullMQ Mail Queue connections shut down cleanly.');
    } catch (err) {
      this.logger.error(
        `Error during Mail Queue shutdown: ${(err as Error).message}`,
      );
    }
  }
}
