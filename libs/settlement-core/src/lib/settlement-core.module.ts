import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettlementCoreService } from './settlement-core.service';
import { SettlementBatch } from './entities/settlement-batch.entity';
import { SettlementTransaction } from './entities/settlement-transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SettlementBatch, SettlementTransaction])],
  controllers: [],
  providers: [SettlementCoreService],
  exports: [SettlementCoreService, TypeOrmModule],
})
export class SettlementCoreModule {}
