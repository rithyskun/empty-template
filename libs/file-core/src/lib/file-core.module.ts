import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileAttachment } from './entities/file-attachment.entity';
import { FileAttachmentRepository } from './repositories/file-attachment.repository';
import { FileCoreService } from './services/file-core.service';

@Module({
  imports: [TypeOrmModule.forFeature([FileAttachment])],
  providers: [FileAttachmentRepository, FileCoreService],
  exports: [FileAttachmentRepository, FileCoreService],
})
export class FileCoreModule {}
