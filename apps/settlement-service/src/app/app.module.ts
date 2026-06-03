import { Module } from '@nestjs/common';
import { DatabaseModule } from '@erp/database';
import { SecurityModule } from '@erp/security';
import { SettlementCoreModule } from '@erp/settlement-core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SettlementsController } from './settlements/settlements.controller';

@Module({
  imports: [DatabaseModule.forRoot(), SecurityModule, SettlementCoreModule],
  controllers: [AppController, SettlementsController],
  providers: [AppService],
})
export class AppModule {}
