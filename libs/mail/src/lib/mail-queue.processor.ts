import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { MailService } from './mail.service';

@Injectable()
export class MailQueueProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MailQueueProcessor.name);
  private worker: Worker | null = null;
  private redisConnection: any = null;

  constructor(private readonly mailService: MailService) {}

  onModuleInit() {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = Number(process.env.REDIS_PORT) || 6379;

    this.logger.log(
      `Initializing BullMQ Background Worker for Mail Queue on Redis at ${host}:${port}...`,
    );

    try {
      const Redis = require('ioredis');
      this.redisConnection = new Redis({
        host,
        port,
        maxRetriesPerRequest: null,
      });

      this.worker = new Worker(
        'mail-queue',
        async (job: Job) => {
          this.logger.debug(
            `Processing mail job ${job.id} for recipient: ${job.data.to}`,
          );
          const { to, subject, html } = job.data;

          const success = await this.mailService.sendMail(to, subject, html);
          if (!success) {
            throw new Error(`SMTP sending failed for ${to}`);
          }
        },
        {
          connection: this.redisConnection,
          concurrency: 5,
          limiter: {
            max: 10,
            duration: 1000,
          },
        },
      );

      this.worker.on('completed', (job: Job) => {
        this.logger.log(
          `Successfully completed background mail job ${job.id} to recipient: ${job.data.to}`,
        );
      });

      this.worker.on('failed', (job: Job | undefined, err: Error) => {
        this.logger.error(
          `Background mail job ${job?.id} failed to complete: ${err.message}`,
        );
      });

      this.logger.log(
        'BullMQ Background Mail Worker ("mail-queue") is online and listening.',
      );
    } catch (err) {
      this.logger.error(
        `Failed to initialize BullMQ background mail worker: ${(err as Error).message}`,
      );
    }
  }

  async onModuleDestroy() {
    try {
      if (this.worker) await this.worker.close();
      if (this.redisConnection) await this.redisConnection.quit();
      this.logger.log('BullMQ Background Mail Worker shut down cleanly.');
    } catch (err) {
      this.logger.error(
        `Error during Background Mail Worker shutdown: ${(err as Error).message}`,
      );
    }
  }
}
