import { Injectable, OnModuleInit } from '@nestjs/common';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import type { IncomingMessage, ServerResponse } from 'http';
import * as tus from 'tus-node-server';
import { FileCoreService } from '@erp/file-core';

@Injectable()
export class TusServerService implements OnModuleInit {
  private server!: tus.Server;
  private readonly uploadDir: string;

  constructor(private readonly fileService: FileCoreService) {
    this.uploadDir =
      process.env.UPLOAD_DIR || join(process.cwd(), 'uploads', 'tus');
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  onModuleInit() {
    this.server = new tus.Server({
      path: '/files/tus',
    });

    this.server.datastore = new tus.FileStore({
      directory: this.uploadDir,
    });

    // On upload complete, create file_attachment record from metadata
    this.server.on(tus.EVENTS.EVENT_UPLOAD_COMPLETE, async (event) => {
      const file = event.file;
      const metadata = tus.Metadata.parse(file.upload_metadata);

      const entityType = metadata.entityType || 'advance_request';
      const entityId = metadata.entityId;
      const originalName = metadata.originalName || file.id;
      const mimeType = metadata.mimeType || 'application/octet-stream';
      const tenantId = metadata.tenantId;
      const companyId = metadata.companyId;
      const createdBy = metadata.createdBy;

      if (!entityId) {
        console.warn('TUS upload complete without entityId in metadata');
        return;
      }

      const storagePath = join(this.uploadDir, file.id);

      try {
        await this.fileService.create({
          entityType,
          entityId,
          fileName: file.id,
          originalName,
          mimeType,
          size: file.size || 0,
          storagePath,
          storageProvider: 'TUS',
          tenantId,
          companyId,
          createdBy,
        });
      } catch (err) {
        console.error(
          'Failed to create file attachment record after TUS upload:',
          err,
        );
      }
    });
  }

  getServer(): tus.Server {
    return this.server;
  }

  handle(req: IncomingMessage, res: ServerResponse): void {
    this.server.handle(req, res);
  }
}
