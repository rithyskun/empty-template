import { Module } from '@nestjs/common';
import { DatabaseModule } from '@erp/database';
import { SecurityModule } from '@erp/security';
import { PaymentCoreModule } from '@erp/payment-core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PaymentsController } from './payments/payments.controller';

@Module({
  imports: [DatabaseModule.forRoot(), SecurityModule, PaymentCoreModule],
  controllers: [AppController, PaymentsController],
  providers: [AppService],
})
export class AppModule {}
