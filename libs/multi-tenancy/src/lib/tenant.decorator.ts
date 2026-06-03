import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { TenantContext } from './tenant.interceptor';

export const TenantCtx = createParamDecorator(
  (data: keyof TenantContext | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const tenantCtx: TenantContext | undefined = request.tenantContext;
    if (!data) return tenantCtx;
    return tenantCtx ? tenantCtx[data] : undefined;
  },
);
