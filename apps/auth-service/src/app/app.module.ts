import { Module } from '@nestjs/common';
import { DatabaseModule } from '@erp/database';
import { SecurityModule } from '@erp/security';
import { IdentityCoreModule } from '@erp/identity-core';
import { AuthModule as ErpAuthModule } from '@erp/auth';
import { MailModule } from '@erp/mail';
import { BullMQRoot } from '@erp/common';
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
  controllers: [],
  providers: [],
})
export class AppModule {}
