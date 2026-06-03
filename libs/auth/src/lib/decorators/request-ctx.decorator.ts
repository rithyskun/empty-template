import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface RequestContext {
  tenantId: string;
  companyId: string;
  branchId: string;
  userId: string;
  roles: string[];
  traceId: string;
  correlationId: string;
  ip: string;
}

export const RequestCtx = createParamDecorator(
  (
    data: keyof RequestContext | undefined,
    ctx: ExecutionContext,
  ): RequestContext | string => {
    const request = ctx.switchToHttp().getRequest();
    const context: RequestContext = {
      tenantId: request.headers['x-tenant-id'] || '',
      companyId: request.headers['x-company-id'] || '',
      branchId: request.headers['x-branch-id'] || '',
      userId: request.user?.userId || '',
      roles: request.user?.roles || [],
      traceId: request.headers['x-trace-id'] || '',
      correlationId: request.headers['x-correlation-id'] || '',
      ip: request.ip || '',
    };
    return data ? (context[data] as string) : context;
  },
);
