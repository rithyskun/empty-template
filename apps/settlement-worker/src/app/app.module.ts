import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DatabaseModule } from '@erp/database';
import { AuthModule } from '@erp/auth';
import { SettlementCoreModule } from '@erp/settlement-core';
import { BullMQRoot } from '@erp/common';
import { Queues } from '@erp/constants';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SettlementProcessor } from './settlement.processor';

@Module({
  imports: [
    BullMQRoot,
    DatabaseModule.forRoot(),
    AuthModule,
    SettlementCoreModule,
    BullModule.registerQueue({ name: Queues.SETTLEMENT_PROCESS }),
    BullModule.registerQueue({ name: Queues.SETTLEMENT_RETRY }),
  ],
  controllers: [AppController],
  providers: [AppService, SettlementProcessor],
})
export class AppModule {}
