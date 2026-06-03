import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentRequest } from './entities/payment-request.entity';
import { PaymentProviderLog } from './entities/payment-provider-log.entity';
import { PaymentCoreService } from './payment-core.service';
import { PaymentProviderRegistry } from './provider-registry';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([PaymentRequest, PaymentProviderLog])],
  providers: [PaymentCoreService, PaymentProviderRegistry],
  exports: [PaymentCoreService, PaymentProviderRegistry, TypeOrmModule],
})
export class PaymentCoreModule {}
