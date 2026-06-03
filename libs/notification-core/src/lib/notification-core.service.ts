import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationTemplate } from './entities/notification-template.entity';
import { Notification } from './entities/notification.entity';
import type {
  CreateNotificationTemplateDto,
  NotificationTemplateResponseDto,
  SendNotificationDto,
  NotificationResponseDto,
} from './dto/notification.dto';
import { MailQueueService } from '@erp/mail';

@Injectable()
export class NotificationCoreService {
  private readonly logger = new Logger(NotificationCoreService.name);

  constructor(
    @InjectRepository(NotificationTemplate)
    private readonly templateRepo: Repository<NotificationTemplate>,
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    private readonly mailQueueService: MailQueueService,
  ) {}

  async createTemplate(
    dto: CreateNotificationTemplateDto,
  ): Promise<NotificationTemplateResponseDto> {
    const entity = this.templateRepo.create(dto);
    const saved = await this.templateRepo.save(entity);
    return this.toTemplateResponse(saved);
  }

  async findTemplateByCode(
    code: string,
    tenantId?: string,
  ): Promise<NotificationTemplateResponseDto | null> {
    const where: Record<string, unknown> = { code, isDeleted: false };
    if (tenantId) where['tenantId'] = tenantId;
    const entity = await this.templateRepo.findOne({ where });
    if (!entity) return null;
    return this.toTemplateResponse(entity);
  }

  async listTemplates(params: {
    tenantId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: NotificationTemplateResponseDto[]; total: number }> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const where: Record<string, unknown> = { isDeleted: false };
    if (params.tenantId) where['tenantId'] = params.tenantId;
    const [items, total] = await this.templateRepo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data: items.map((i) => this.toTemplateResponse(i)), total };
  }

  async send(dto: SendNotificationDto): Promise<NotificationResponseDto> {
    let body = dto.body;
    if (dto.templateCode) {
      const template = await this.templateRepo.findOne({
        where: { code: dto.templateCode, isDeleted: false },
      });
      if (template) {
        body = template.bodyTemplate;
        if (dto.templateData) {
          for (const [key, value] of Object.entries(dto.templateData)) {
            body = body.replace(
              new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
              String(value),
            );
          }
        }
      }
    }
    const entity = this.notificationRepo.create({
      ...dto,
      body,
      status: 'PENDING',
    });
    const saved = await this.notificationRepo.save(entity);

    // Queue email asynchronously in the background via BullMQ
    if (dto.channel === 'EMAIL' && dto.recipientEmail) {
      try {
        await this.mailQueueService.queueMail(
          dto.recipientEmail,
          dto.title || 'Platform Notification',
          body,
        );
      } catch (err) {
        this.logger.error(
          `Failed to queue notification email to ${dto.recipientEmail}: ${(err as Error).message}`,
        );
      }
    }

    return this.toNotificationResponse(saved);
  }

  async markSent(id: string): Promise<void> {
    await this.notificationRepo.update(id, {
      status: 'SENT',
      sentAt: new Date(),
    });
  }

  async markFailed(id: string, errorMessage: string): Promise<void> {
    await this.notificationRepo.update(id, { status: 'FAILED', errorMessage });
  }

  async markRead(id: string): Promise<void> {
    await this.notificationRepo.update(id, { readAt: new Date() });
  }

  async listNotifications(params: {
    recipientId?: string;
    status?: string;
    tenantId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: NotificationResponseDto[]; total: number }> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const where: Record<string, unknown> = { isDeleted: false };
    if (params.recipientId) where['recipientId'] = params.recipientId;
    if (params.status) where['status'] = params.status;
    if (params.tenantId) where['tenantId'] = params.tenantId;
    const [items, total] = await this.notificationRepo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data: items.map((i) => this.toNotificationResponse(i)), total };
  }

  private toTemplateResponse(
    e: NotificationTemplate,
  ): NotificationTemplateResponseDto {
    return {
      id: e.id,
      code: e.code,
      name: e.name,
      channel: e.channel,
      subject: e.subject,
      bodyTemplate: e.bodyTemplate,
      isActive: e.isActive,
      tenantId: e.tenantId,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    };
  }

  private toNotificationResponse(e: Notification): NotificationResponseDto {
    return {
      id: e.id,
      recipientId: e.recipientId,
      recipientEmail: e.recipientEmail,
      recipientPhone: e.recipientPhone,
      channel: e.channel,
      title: e.title,
      body: e.body,
      templateCode: e.templateCode,
      referenceType: e.referenceType,
      referenceId: e.referenceId,
      status: e.status,
      sentAt: e.sentAt,
      readAt: e.readAt,
      errorMessage: e.errorMessage,
      createdAt: e.createdAt,
    };
  }
}
