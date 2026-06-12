import {
  StringField,
  NumberField,
  UuidField,
  OptionalStringField,
  DateField,
} from '@erp/common';

export class CreateFileAttachmentDto {
  @StringField({
    description: 'Entity type (e.g., advance_request)',
    example: 'advance_request',
  })
  entityType!: string;

  @UuidField({
    description: 'Entity ID the file is attached to',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  entityId!: string;

  @StringField({
    description: 'Stored file name',
    example: 'upload_1234567890.pdf',
  })
  fileName!: string;

  @StringField({
    description: 'Original file name from user',
    example: 'invoice.pdf',
  })
  originalName!: string;

  @StringField({ description: 'MIME type', example: 'application/pdf' })
  mimeType!: string;

  @NumberField({ description: 'File size in bytes', min: 0, example: 1024000 })
  size!: number;

  @StringField({
    description: 'Storage path',
    example: '/uploads/2024/06/file.pdf',
  })
  storagePath!: string;

  @OptionalStringField({ description: 'Storage provider', example: 'LOCAL' })
  storageProvider?: string;

  @OptionalStringField({
    description: 'Public URL',
    example: 'https://cdn.example.com/file.pdf',
  })
  url?: string;

  @OptionalStringField({ description: 'Tenant ID', example: 'tenant-001' })
  tenantId?: string;

  @OptionalStringField({ description: 'Company ID', example: 'company-001' })
  companyId?: string;

  @OptionalStringField({
    description: 'Created by user ID',
    example: 'user-001',
  })
  createdBy?: string;
}

export class FileAttachmentResponseDto {
  @UuidField({ description: 'Attachment ID' })
  id!: string;

  @StringField({ description: 'Entity type' })
  entityType!: string;

  @UuidField({ description: 'Entity ID' })
  entityId!: string;

  @StringField({ description: 'Stored file name' })
  fileName!: string;

  @StringField({ description: 'Original file name' })
  originalName!: string;

  @StringField({ description: 'MIME type' })
  mimeType!: string;

  @NumberField({ description: 'File size in bytes', min: 0 })
  size!: number;

  @StringField({ description: 'Storage path' })
  storagePath!: string;

  @StringField({ description: 'Storage provider' })
  storageProvider!: string;

  @OptionalStringField({ description: 'Public URL' })
  url?: string;

  @OptionalStringField({ description: 'Tenant ID' })
  tenantId?: string;

  @OptionalStringField({ description: 'Company ID' })
  companyId?: string;

  @OptionalStringField({ description: 'Created by user ID' })
  createdBy?: string;

  @DateField({ description: 'Creation timestamp' })
  createdAt!: Date;

  @DateField({ description: 'Last update timestamp' })
  updatedAt!: Date;
}
