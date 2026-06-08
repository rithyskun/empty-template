import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DatabaseModule } from '@erp/database';
import { PaymentCoreModule } from '@erp/payment-core';
import { BullMQRoot } from '@erp/common';
import { Queues } from '@erp/constants';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PaymentProcessor } from './payment.processor';

@Module({
  imports: [
    BullMQRoot,
    DatabaseModule.forRoot(),
    PaymentCoreModule,
    BullModule.registerQueue({ name: Queues.PAYMENT_EXECUTE }),
    BullModule.registerQueue({ name: Queues.PAYMENT_RETRY }),
  ],
  controllers: [AppController],
  providers: [AppService, PaymentProcessor],
})
export class AppModule {}
