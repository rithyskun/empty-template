import { Module } from '@nestjs/common';
import { DatabaseModule } from '@erp/database';
import { SecurityModule } from '@erp/security';
import { AdvanceCoreModule } from '@erp/advance-core';
import { FileCoreModule } from '@erp/file-core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdvanceController } from './advance/advance.controller';

@Module({
  imports: [
    DatabaseModule.forRoot(),
    SecurityModule,
    AdvanceCoreModule,
    FileCoreModule,
  ],
  controllers: [AppController, AdvanceController],
  providers: [AppService],
})
export class AppModule {}
