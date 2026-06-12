import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@erp/common';
import { FileAttachment } from '../entities/file-attachment.entity';

@Injectable()
export class FileAttachmentRepository extends BaseRepository<FileAttachment> {
  constructor(
    @InjectRepository(FileAttachment)
    repo: Repository<FileAttachment>,
  ) {
    super(repo);
  }

  async findByEntity(
    entityType: string,
    entityId: string,
  ): Promise<FileAttachment[]> {
    return this.repo.find({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
    });
  }

  async deleteByEntity(entityType: string, entityId: string): Promise<void> {
    await this.repo.delete({ entityType, entityId });
  }
}
