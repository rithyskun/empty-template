import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { NotificationCoreService } from '@erp/notification-core';
import type {
  CreateNotificationTemplateDto,
  SendNotificationDto,
} from '@erp/notification-core';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationCore: NotificationCoreService) {}

  @Post('templates')
  createTemplate(@Body() dto: CreateNotificationTemplateDto) {
    return this.notificationCore.createTemplate(dto);
  }

  @Get('templates')
  listTemplates(
    @Query('tenantId') tenantId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.notificationCore.listTemplates({ tenantId, page, limit });
  }

  @Post('send')
  send(@Body() dto: SendNotificationDto) {
    return this.notificationCore.send(dto);
  }

  @Get()
  listNotifications(
    @Query('recipientId') recipientId?: string,
    @Query('status') status?: string,
    @Query('tenantId') tenantId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.notificationCore.listNotifications({
      recipientId,
      status,
      tenantId,
      page,
      limit,
    });
  }
}
