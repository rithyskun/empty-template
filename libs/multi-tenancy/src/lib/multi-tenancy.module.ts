import { Module, Global } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TenantInterceptor } from './tenant.interceptor';
import { TenantGuard } from './tenant.guard';

@Global()
@Module({
  providers: [
    TenantGuard,
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
  ],
  exports: [TenantGuard],
})
export class MultiTenancyModule {}
