import { Injectable } from '@nestjs/common';
import { FileAttachmentRepository } from '../repositories/file-attachment.repository';
import { FileAttachment } from '../entities/file-attachment.entity';
import type {
  CreateFileAttachmentDto,
  FileAttachmentResponseDto,
} from '../dto/file-attachment.dto';

@Injectable()
export class FileCoreService {
  constructor(private readonly repository: FileAttachmentRepository) {}

  async create(
    dto: CreateFileAttachmentDto,
  ): Promise<FileAttachmentResponseDto> {
    const saved = await this.repository.create(dto);
    return this.toResponse(saved);
  }

  async findByEntity(
    entityType: string,
    entityId: string,
  ): Promise<FileAttachmentResponseDto[]> {
    const items = await this.repository.findByEntity(entityType, entityId);
    return items.map((e) => this.toResponse(e));
  }

  async findOne(id: string): Promise<FileAttachmentResponseDto | null> {
    const entity = await this.repository.findById(id);
    return entity ? this.toResponse(entity) : null;
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  private toResponse(e: FileAttachment): FileAttachmentResponseDto {
    return {
      id: e.id,
      entityType: e.entityType,
      entityId: e.entityId,
      fileName: e.fileName,
      originalName: e.originalName,
      mimeType: e.mimeType,
      size: e.size,
      storagePath: e.storagePath,
      storageProvider: e.storageProvider,
      url: e.url,
      tenantId: e.tenantId,
      companyId: e.companyId,
      createdBy: e.createdBy,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    };
  }
}
