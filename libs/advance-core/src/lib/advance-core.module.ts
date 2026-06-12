import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdvanceRequest } from './entities/advance-request.entity';
import { AdvanceRepayment } from './entities/advance-repayment.entity';
import { AdvanceRequestItem } from './entities/advance-request-item.entity';
import { AdvanceCoreService } from './advance-core.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdvanceRequest,
      AdvanceRepayment,
      AdvanceRequestItem,
    ]),
  ],
  providers: [AdvanceCoreService],
  exports: [AdvanceCoreService, TypeOrmModule],
})
export class AdvanceCoreModule {}
