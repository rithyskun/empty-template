import { Module } from '@nestjs/common';
import { DatabaseModule } from '@erp/database';
import { SecurityModule } from '@erp/security';
import { IdentityCoreModule } from '@erp/identity-core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersController } from './users/users.controller';
import { RolesController } from './roles/roles.controller';

@Module({
  imports: [DatabaseModule.forRoot(), SecurityModule, IdentityCoreModule],
  controllers: [AppController, UsersController, RolesController],
  providers: [AppService],
})
export class AppModule {}
