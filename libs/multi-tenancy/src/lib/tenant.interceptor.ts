import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

export interface TenantContext {
  tenantId: string;
  companyId: string;
  branchId: string;
  userId: string;
  roles: string[];
}

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const tenantCtx: TenantContext = {
      tenantId: request.headers['x-tenant-id'] || request.user?.tenantId || '',
      companyId:
        request.headers['x-company-id'] || request.user?.companyId || '',
      branchId: request.headers['x-branch-id'] || request.user?.branchId || '',
      userId: request.user?.userId || '',
      roles: request.user?.roles || [],
    };
    request.tenantContext = tenantCtx;
    return next.handle();
  }
}

export const TENANT_CONTEXT_KEY = 'tenantContext';

export function getTenantContext(request: {
  tenantContext?: TenantContext;
}): TenantContext | undefined {
  return request.tenantContext;
}
