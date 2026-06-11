import { Module, Global } from '@nestjs/common';
import { APP_GUARD, APP_FILTER, APP_PIPE, APP_INTERCEPTOR } from '@nestjs/core';
import {
  AuthModule,
  JwtAuthGuard,
  RolesGuard,
  PermissionsGuard,
} from '@erp/auth';
import { MultiTenancyModule } from '@erp/multi-tenancy';
import { GlobalExceptionFilter } from './global-exception.filter';
import { GlobalValidationPipe } from './global-validation.pipe';
import { GlobalResponseInterceptor } from './global-response.interceptor';

@Global()
@Module({
  imports: [AuthModule, MultiTenancyModule],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_PIPE, useClass: GlobalValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: GlobalResponseInterceptor },
  ],
  exports: [AuthModule, MultiTenancyModule],
})
export class SecurityModule {}
