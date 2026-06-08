import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DatabaseModule } from '@erp/database';
import { NotificationCoreModule } from '@erp/notification-core';
import { BullMQRoot } from '@erp/common';
import { Queues } from '@erp/constants';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NotificationProcessor } from './notification.processor';

@Module({
  imports: [
    BullMQRoot,
    DatabaseModule.forRoot(),
    NotificationCoreModule,
    BullModule.registerQueue({ name: Queues.NOTIFICATION_SEND }),
  ],
  controllers: [AppController],
  providers: [AppService, NotificationProcessor],
})
export class AppModule {}
