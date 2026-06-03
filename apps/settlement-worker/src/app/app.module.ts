import { Module } from '@nestjs/common';
import { DatabaseModule } from '@erp/database';
import { AuthModule } from '@erp/auth';
import { SettlementCoreModule } from '@erp/settlement-core';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [DatabaseModule.forRoot(), AuthModule, SettlementCoreModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
