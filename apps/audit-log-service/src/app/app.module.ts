import { Module } from '@nestjs/common';
import { DatabaseModule } from '@erp/database';
import { SecurityModule } from '@erp/security';
import { AuditCoreModule } from '@erp/audit-core';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogEntry } from '@erp/audit-core';
import { BullMQRoot } from '@erp/common';
import { Queues } from '@erp/constants';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuditLogController } from './audit-log.controller';
import { AuditLogProcessor } from './audit-log.processor';

@Module({
  imports: [
    BullMQRoot,
    DatabaseModule.forRoot(),
    SecurityModule,
    AuditCoreModule,
    TypeOrmModule.forFeature([AuditLogEntry]),
    BullModule.registerQueue({ name: Queues.AUDIT_LOG }),
  ],
  controllers: [AppController, AuditLogController],
  providers: [AppService, AuditLogProcessor],
})
export class AppModule {}
