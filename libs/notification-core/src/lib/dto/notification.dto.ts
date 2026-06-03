export interface CreateNotificationTemplateDto {
  code: string;
  name: string;
  channel: string;
  subject?: string;
  bodyTemplate: string;
  isActive?: boolean;
  tenantId?: string;
}

export interface NotificationTemplateResponseDto {
  id: string;
  code: string;
  name: string;
  channel: string;
  subject?: string;
  bodyTemplate: string;
  isActive: boolean;
  tenantId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SendNotificationDto {
  recipientId?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  channel: string;
  title?: string;
  body: string;
  templateCode?: string;
  templateData?: Record<string, unknown>;
  referenceType?: string;
  referenceId?: string;
  tenantId?: string;
  companyId?: string;
  branchId?: string;
}

export interface NotificationResponseDto {
  id: string;
  recipientId?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  channel: string;
  title?: string;
  body: string;
  templateCode?: string;
  referenceType?: string;
  referenceId?: string;
  status: string;
  sentAt?: Date;
  readAt?: Date;
  errorMessage?: string;
  createdAt: Date;
}
