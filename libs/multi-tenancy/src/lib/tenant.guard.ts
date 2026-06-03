import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const tenantId =
      request.tenantContext?.tenantId || request.headers['x-tenant-id'];
    if (!tenantId) {
      throw new UnauthorizedException('Tenant context required');
    }
    return true;
  }
}
