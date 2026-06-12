import { Entity, Column } from 'typeorm';
import { AuditableEntity } from '@erp/common';

@Entity('file_attachments')
export class FileAttachment extends AuditableEntity {
  @Column({ length: 100 })
  entityType!: string;

  @Column('uuid')
  entityId!: string;

  @Column({ length: 255 })
  fileName!: string;

  @Column({ length: 255 })
  originalName!: string;

  @Column({ length: 100 })
  mimeType!: string;

  @Column()
  size!: number;

  @Column({ length: 500 })
  storagePath!: string;

  @Column({ length: 50, default: 'LOCAL' })
  storageProvider!: string;

  @Column({ length: 500, nullable: true })
  url!: string;
}
