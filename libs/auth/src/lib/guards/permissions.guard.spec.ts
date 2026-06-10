import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { PermissionsGuard } from './permissions.guard';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  const makeContext = (user: Record<string, unknown> = {}) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  it('allows access for public routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return true;
      return undefined;
    });

    expect(guard.canActivate(makeContext())).toBe(true);
  });

  it('allows access when no permissions are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === PERMISSIONS_KEY) return undefined;
      return undefined;
    });

    expect(guard.canActivate(makeContext())).toBe(true);
  });

  it('denies access when user has no permissions property', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === PERMISSIONS_KEY) return ['users:read'];
      return undefined;
    });

    expect(guard.canActivate(makeContext({}))).toBe(false);
  });

  it('denies access when user lacks the required permission', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === PERMISSIONS_KEY) return ['users:write'];
      return undefined;
    });

    expect(
      guard.canActivate(makeContext({ permissions: ['users:read'] })),
    ).toBe(false);
  });

  it('allows access when user has the exact required permission', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === PERMISSIONS_KEY) return ['users:read'];
      return undefined;
    });

    expect(
      guard.canActivate(makeContext({ permissions: ['users:read'] })),
    ).toBe(true);
  });

  it('allows access when user has one of several required permissions', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === PERMISSIONS_KEY) return ['users:write', 'payments:read'];
      return undefined;
    });

    expect(
      guard.canActivate(makeContext({ permissions: ['payments:read'] })),
    ).toBe(true);
  });

  it('allows access for all:all wildcard', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === PERMISSIONS_KEY) return ['users:write'];
      return undefined;
    });

    expect(guard.canActivate(makeContext({ permissions: ['all:all'] }))).toBe(
      true,
    );
  });

  it('allows access for SUPER_ADMIN via roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === PERMISSIONS_KEY) return ['users:write'];
      return undefined;
    });

    expect(
      guard.canActivate(
        makeContext({ roles: ['SUPER_ADMIN'], permissions: [] }),
      ),
    ).toBe(true);
  });
});
