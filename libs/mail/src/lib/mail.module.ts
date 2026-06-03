import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailQueueService } from './mail-queue.service';
import { MailQueueProcessor } from './mail-queue.processor';

@Module({
  providers: [MailService, MailQueueService, MailQueueProcessor],
  exports: [MailService, MailQueueService],
})
export class MailModule {}
