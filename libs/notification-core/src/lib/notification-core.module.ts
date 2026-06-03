import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationTemplate } from './entities/notification-template.entity';
import { Notification } from './entities/notification.entity';
import { NotificationCoreService } from './notification-core.service';
import { MailModule } from '@erp/mail';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationTemplate, Notification]),
    MailModule,
  ],
  providers: [NotificationCoreService],
  exports: [NotificationCoreService, TypeOrmModule],
})
export class NotificationCoreModule {}
