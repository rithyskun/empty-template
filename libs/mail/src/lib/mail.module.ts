import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BullMQRoot } from '@erp/common';
import { MailService } from './mail.service';
import { MailQueueService } from './mail-queue.service';
import { MailProcessor } from './mail.processor';

@Module({
  imports: [BullMQRoot, BullModule.registerQueue({ name: 'mail-queue' })],
  providers: [MailService, MailQueueService, MailProcessor],
  exports: [MailService, MailQueueService],
})
export class MailModule {}
