import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class MailQueueService {
  private readonly logger = new Logger(MailQueueService.name);

  constructor(
    @InjectQueue('mail-queue')
    private readonly mailQueue: Queue,
  ) {}

  async queueMail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      this.logger.debug(`Queueing email background job for: ${to}`);
      await this.mailQueue.add('send-single-email', {
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
    try {
      this.logger.log(`Bulk-queueing ${jobs.length} notification emails...`);
      const formattedJobs = jobs.map((job) => ({
        name: 'send-bulk-email',
        data: job,
      }));

      await this.mailQueue.addBulk(formattedJobs);
      this.logger.log(
        `Successfully batched ${jobs.length} jobs onto the "mail-queue".`,
      );
    } catch (err) {
      this.logger.error(
        `Failed to execute bulk queue addition: ${(err as Error).message}`,
      );
    }
  }
}
