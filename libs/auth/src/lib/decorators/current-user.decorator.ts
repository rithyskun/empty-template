import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UserPayload {
  userId: string;
  tenantId: string;
  companyId: string;
  roles: string[];
  email?: string;
}

export const CurrentUser = createParamDecorator(
  (
    data: keyof UserPayload | undefined,
    ctx: ExecutionContext,
  ): UserPayload | string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as UserPayload | undefined;
    return data ? (user?.[data] as string | undefined) : user;
  },
);
