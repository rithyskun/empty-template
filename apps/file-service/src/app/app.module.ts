import { Module } from '@nestjs/common';
import { DatabaseModule } from '@erp/database';
import { SecurityModule } from '@erp/security';
import { FileCoreModule } from '@erp/file-core';
import { TusController } from './tus/tus.controller';
import { TusServerService } from './tus/tus-server.service';

@Module({
  imports: [DatabaseModule.forRoot(), SecurityModule, FileCoreModule],
  controllers: [TusController],
  providers: [TusServerService],
})
export class AppModule {}
