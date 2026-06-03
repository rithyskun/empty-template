import { Module } from '@nestjs/common';
import { DatabaseModule } from '@erp/database';
import { SecurityModule } from '@erp/security';
import { NotificationCoreModule } from '@erp/notification-core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NotificationsController } from './notifications/notifications.controller';

@Module({
  imports: [DatabaseModule.forRoot(), SecurityModule, NotificationCoreModule],
  controllers: [AppController, NotificationsController],
  providers: [AppService],
})
export class AppModule {}
