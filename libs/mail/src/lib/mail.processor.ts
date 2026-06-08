import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MailService } from './mail.service';

@Processor('mail-queue', {
  concurrency: 5,
  limiter: {
    max: 10,
    duration: 1000,
  },
})
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(private readonly mailService: MailService) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name === 'send-single-email') {
      const { to, subject, html } = job.data;
      this.logger.debug(`Processing mail job ${job.id} for recipient: ${to}`);
      const success = await this.mailService.sendMail(to, subject, html);
      if (!success) {
        throw new Error(`SMTP sending failed for ${to}`);
      }
    } else if (job.name === 'send-bulk-email') {
      const { to, subject, html } = job.data;
      this.logger.debug(`Processing bulk mail job ${job.id} for recipient: ${to}`);
      await this.mailService.sendMail(to, subject, html);
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(
      `Successfully completed background mail job ${job.id} to recipient: ${job.data.to}`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Background mail job ${job.id} failed to complete: ${error.message}`,
    );
  }
}
