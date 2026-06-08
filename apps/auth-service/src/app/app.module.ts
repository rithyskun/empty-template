import { Module } from '@nestjs/common';
import { DatabaseModule } from '@erp/database';
import { SecurityModule } from '@erp/security';
import { IdentityCoreModule } from '@erp/identity-core';
import { AuthModule as ErpAuthModule } from '@erp/auth';
import { MailModule } from '@erp/mail';
import { BullMQRoot } from '@erp/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    BullMQRoot,
    DatabaseModule.forRoot(),
    SecurityModule,
    IdentityCoreModule,
    ErpAuthModule,
    MailModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
